import {
  NUMERIC_TYPES,
  TEXT_TYPES,
  DATE_TYPES,
  BOOLEAN_TYPES,
  FORMULA_FUNCTIONS,
  CURRENCY_SYMBOLS,
  FUNCTION_SYNTAX_MAP,
  VALID_DATE_UNITS,
  MATH_FUNCTION_NAMES,
  TEXT_FUNCTION_NAMES,
  DATE_FUNCTION_NAMES,
  LOGICAL_FUNCTION_NAMES,
  ALL_FUNCTION_NAMES,
  COMPARISON_OPERATORS
} from './formulaConstants';

// Types for helper functions
export interface FormulaContext {
  columns: any[];
  allColumns: any[];
  rowData?: Record<string, any>;
}

// Parse field reference from formula (e.g., {Price} -> "Price")
const isWhitespaceChar = (ch: string) =>
  ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t' || ch === '\f' || ch === '\v';

const isDigitChar = (ch: string) => ch >= '0' && ch <= '9';

const isUpperAlpha = (ch: string) => ch >= 'A' && ch <= 'Z';

const isIdentStart = (ch: string) => isUpperAlpha(ch) || ch === '_';

const isIdentChar = (ch: string) => isUpperAlpha(ch) || isDigitChar(ch) || ch === '_';

const parseNumberLiteralAt = (input: string, start: number): number => {
  let i = start;
  if (input[i] === '-') i++;
  let digitsBefore = 0;
  while (i < input.length && isDigitChar(input[i])) {
    digitsBefore++;
    i++;
  }
  let digitsAfter = 0;
  if (i < input.length && input[i] === '.') {
    i++;
    while (i < input.length && isDigitChar(input[i])) {
      digitsAfter++;
      i++;
    }
    if (digitsBefore === 0 && digitsAfter === 0) return 0;
    return i - start;
  }
  if (digitsBefore === 0) return 0;
  return i - start;
};

const isNumericLiteral = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const len = parseNumberLiteralAt(trimmed, 0);
  return len === trimmed.length;
};

const containsFunctionCallToken = (value: string): boolean => {
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (!isIdentStart(ch)) continue;
    let j = i + 1;
    while (j < value.length && isIdentChar(value[j])) j++;
    while (j < value.length && isWhitespaceChar(value[j])) j++;
    if (j < value.length && value[j] === '(') return true;
    i = j;
  }
  return false;
};

const startsWithFunctionCall = (value: string): boolean => {
  let i = 0;
  while (i < value.length && isWhitespaceChar(value[i])) i++;
  if (i >= value.length || !isIdentStart(value[i])) return false;
  let j = i + 1;
  while (j < value.length && isIdentChar(value[j])) j++;
  while (j < value.length && isWhitespaceChar(value[j])) j++;
  return j < value.length && value[j] === '(';
};

const collectNumericLiterals = (input: string): string[] => {
  const numbers: string[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '-' || ch === '.' || isDigitChar(ch)) {
      const len = parseNumberLiteralAt(input, i);
      if (len > 0) {
        numbers.push(input.slice(i, i + len));
        i += len;
        continue;
      }
    }
    i++;
  }
  return numbers;
};

const extractFieldReferences = (input: string): string[] => {
  const refs: string[] = [];
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== '{') continue;
    const end = input.indexOf('}', i + 1);
    if (end === -1) break;
    refs.push(input.slice(i, end + 1));
    i = end;
  }
  return refs;
};

const removeFieldRefsAndQuoted = (input: string): string => {
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '{') {
      const end = input.indexOf('}', i + 1);
      if (end === -1) break;
      i = end;
      continue;
    }
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < input.length) {
        if (input[j] === quote && input[j - 1] !== '\\') break;
        j++;
      }
      if (j >= input.length) break;
      i = j;
      continue;
    }
    out += ch;
  }
  return out;
};

const getFirstParenContent = (input: string): string | null => {
  const open = input.indexOf('(');
  if (open === -1) return null;
  const close = input.indexOf(')', open + 1);
  if (close === -1 || close === open + 1) return null;
  return input.slice(open + 1, close);
};

const countChar = (input: string, target: string): number => {
  let count = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target) count++;
  }
  return count;
};

const findFunctionCalls = (
  formula: string,
  names: string[]
): Array<{ name: string; index: number; args: string; openParenIndex: number; closeParenIndex: number }> => {
  const upperFormula = formula.toUpperCase();
  const nameSet = new Set(names.map(n => n.toUpperCase()));
  const matches: Array<{ name: string; index: number; args: string; openParenIndex: number; closeParenIndex: number }> = [];

  for (let i = 0; i < upperFormula.length; i++) {
    const ch = upperFormula[i];
    if (!isIdentStart(ch)) continue;
    let j = i + 1;
    while (j < upperFormula.length && isIdentChar(upperFormula[j])) j++;
    const name = upperFormula.slice(i, j);
    if (!nameSet.has(name)) {
      i = j - 1;
      continue;
    }
    let k = j;
    while (k < upperFormula.length && isWhitespaceChar(upperFormula[k])) k++;
    if (k >= upperFormula.length || upperFormula[k] !== '(') {
      i = j - 1;
      continue;
    }
    const close = formula.indexOf(')', k + 1);
    if (close === -1) {
      i = j - 1;
      continue;
    }
    const args = formula.slice(k + 1, close);
    matches.push({ name, index: i, args, openParenIndex: k, closeParenIndex: close });
    i = close;
  }

  return matches;
};

const findOperatorMatches = (
  formula: string,
  operators: string[]
): Array<{ op: string; index: number }> => {
  const matches: Array<{ op: string; index: number }> = [];
  const ops = [...operators].sort((a, b) => b.length - a.length);
  for (let i = 0; i < formula.length; i++) {
    let matched = false;
    for (const op of ops) {
      if (formula.startsWith(op, i)) {
        matches.push({ op, index: i });
        i += op.length - 1;
        matched = true;
        break;
      }
    }
    if (matched) continue;
  }
  return matches;
};

export const parseFieldReference = (ref: string): string => {
  if (ref.startsWith('{') && ref.endsWith('}') && ref.length > 2) {
    return ref.slice(1, -1);
  }
  return '';
};

// Get column identifier (column_name or key) from title/name
export const getColumnIdentifier = (
  fieldName: string,
  context: FormulaContext
): string | null => {
  const { columns, allColumns } = context;
  const searchColumns = allColumns.length > 0 ? allColumns : columns;
  const column = searchColumns.find(
    col => {
      const colTitle = col.title || col.name;
      const colName = col.name;
      const colColumnName = col.column_name;
      return colTitle === fieldName || colName === fieldName || colColumnName === fieldName;
    }
  );
  
  if (column) {
    return column.key || column.column_name || column.id || null;
  }
  
  return null;
};

// Get field type from field name
export const getFieldType = (
  fieldName: string,
  context: FormulaContext
): string | null => {
  const { columns, allColumns } = context;
  const searchColumns = allColumns.length > 0 ? allColumns : columns;
  const column = searchColumns.find(
    col => {
      const colTitle = col.title || col.name;
      const colName = col.name;
      const colColumnName = col.column_name;
      return colTitle === fieldName || colName === fieldName || colColumnName === fieldName;
    }
  );
  
  if (column) {
    return column.type || column.uidt || null;
  }
  
  return null;
};

// Check if a field type is numeric
export const isNumericType = (fieldType: string | null): boolean => {
  if (!fieldType) return false;
  return NUMERIC_TYPES.includes(fieldType.toLowerCase());
};

// Check if a field type is text
export const isTextType = (fieldType: string | null): boolean => {
  if (!fieldType) return false;
  return TEXT_TYPES.includes(fieldType.toLowerCase());
};

// Check if a field type is date/datetime
export const isDateType = (fieldType: string | null): boolean => {
  if (!fieldType) return false;
  return DATE_TYPES.includes(fieldType.toLowerCase());
};

// Check if a field type is boolean
export const isBooleanType = (fieldType: string | null): boolean => {
  if (!fieldType) return false;
  return BOOLEAN_TYPES.includes(fieldType.toLowerCase());
};

// Get field value from row data or use sample values for preview
export const getFieldValue = (
  fieldName: string,
  context: FormulaContext
): number => {
  const { columns, allColumns, rowData } = context;
  const columnIdentifier = getColumnIdentifier(fieldName, context);
  
  if (rowData) {
    if (columnIdentifier) {
      if (rowData[columnIdentifier] !== undefined) {
        const val = rowData[columnIdentifier];
        const num = typeof val === 'string' ? Number.parseFloat(val) : Number(val);
        if (!Number.isNaN(num)) return num;
      }
      
      if (rowData.data && typeof rowData.data === 'object') {
        if (rowData.data[columnIdentifier] !== undefined) {
          const val = rowData.data[columnIdentifier];
          const num = typeof val === 'string' ? Number.parseFloat(val) : Number(val);
          if (!Number.isNaN(num)) return num;
        }
      }
    }
    
    if (rowData[fieldName] !== undefined) {
      const val = rowData[fieldName];
      const num = typeof val === 'string' ? Number.parseFloat(val) : Number(val);
      if (!Number.isNaN(num)) return num;
    }
    
    if (rowData.data && typeof rowData.data === 'object') {
      if (rowData.data[fieldName] !== undefined) {
        const val = rowData.data[fieldName];
        const num = typeof val === 'string' ? Number.parseFloat(val) : Number(val);
        if (!Number.isNaN(num)) return num;
      }
    }
  }
  
  const column = (allColumns.length > 0 ? allColumns : columns).find(
    col => col.title === fieldName || col.name === fieldName || col.column_name === fieldName
  );
  if (column) {
    return 10 + (fieldName.length % 10);
  }
  
  return 0;
};

// Get text field value from row data or use sample values for preview
export const getTextFieldValue = (
  fieldName: string,
  context: FormulaContext
): string => {
  const { columns, allColumns, rowData } = context;
  const columnIdentifier = getColumnIdentifier(fieldName, context);
  
  if (rowData) {
    if (columnIdentifier) {
      if (rowData[columnIdentifier] !== undefined) {
        const val = rowData[columnIdentifier];
        return String(val ?? '');
      }
      
      if (rowData.data && typeof rowData.data === 'object') {
        if (rowData.data[columnIdentifier] !== undefined) {
          const val = rowData.data[columnIdentifier];
          return String(val ?? '');
        }
      }
    }
    
    if (rowData[fieldName] !== undefined) {
      const val = rowData[fieldName];
      return String(val ?? '');
    }
    
    if (rowData.data && typeof rowData.data === 'object') {
      if (rowData.data[fieldName] !== undefined) {
        const val = rowData.data[fieldName];
        return String(val ?? '');
      }
    }
  }
  
  const column = (allColumns.length > 0 ? allColumns : columns).find(
    col => col.title === fieldName || col.name === fieldName || col.column_name === fieldName
  );
  if (column) {
    return `Sample ${fieldName}`;
  }
  
  return '';
};

// Get boolean field value from row data or use sample values for preview
export const getBooleanValue = (
  fieldName: string,
  context: FormulaContext
): boolean | null => {
  const { columns, allColumns, rowData } = context;
  const columnIdentifier = getColumnIdentifier(fieldName, context);
  
  if (rowData) {
    if (columnIdentifier) {
      if (rowData[columnIdentifier] !== undefined) {
        const val = rowData[columnIdentifier];
        return Boolean(val);
      }
      
      if (rowData.data && typeof rowData.data === 'object') {
        if (rowData.data[columnIdentifier] !== undefined) {
          const val = rowData.data[columnIdentifier];
          return Boolean(val);
        }
      }
    }
    
    if (rowData[fieldName] !== undefined) {
      const val = rowData[fieldName];
      return Boolean(val);
    }
    
    if (rowData.data && typeof rowData.data === 'object') {
      if (rowData.data[fieldName] !== undefined) {
        const val = rowData.data[fieldName];
        return Boolean(val);
      }
    }
  }
  
  const column = (allColumns.length > 0 ? allColumns : columns).find(
    col => col.title === fieldName || col.name === fieldName || col.column_name === fieldName
  );
  if (column) {
    const fieldType = column.type || column.uidt;
    if (fieldType === 'boolean' || fieldType === 'checkbox') {
      return false;
    }
  }
  
  return null;
};

// Get date field value from row data or use sample values for preview
export const getDateValue = (
  fieldName: string,
  context: FormulaContext
): Date | null => {
  const { rowData } = context;
  const columnIdentifier = getColumnIdentifier(fieldName, context);
  
  if (rowData) {
    if (columnIdentifier) {
      if (rowData[columnIdentifier] !== undefined) {
        const val = rowData[columnIdentifier];
        if (val) {
          const date = new Date(val);
          if (!Number.isNaN(date.getTime())) return date;
        }
      }
      
      if (rowData.data && typeof rowData.data === 'object') {
        if (rowData.data[columnIdentifier] !== undefined) {
          const val = rowData.data[columnIdentifier];
          if (val) {
            const date = new Date(val);
            if (!Number.isNaN(date.getTime())) return date;
          }
        }
      }
    }
    
    if (rowData[fieldName] !== undefined) {
      const val = rowData[fieldName];
      if (val) {
        const date = new Date(val);
        if (!Number.isNaN(date.getTime())) return date;
      }
    }
    
    if (rowData.data && typeof rowData.data === 'object') {
      if (rowData.data[fieldName] !== undefined) {
        const val = rowData.data[fieldName];
        if (val) {
          const date = new Date(val);
          if (!Number.isNaN(date.getTime())) return date;
        }
      }
    }
  }
  
  return new Date();
};

// Get field value based on its type
export const getFieldValueByType = (
  fieldName: string,
  context: FormulaContext
): any => {
  const fieldType = getFieldType(fieldName, context);
  
  if (isBooleanType(fieldType)) {
    return getBooleanValue(fieldName, context);
  } else if (isDateType(fieldType)) {
    return getDateValue(fieldName, context);
  } else if (isNumericType(fieldType)) {
    return getFieldValue(fieldName, context);
  } else if (isTextType(fieldType)) {
    return getTextFieldValue(fieldName, context);
  } else {
    const boolVal = getBooleanValue(fieldName, context);
    if (boolVal !== null) return boolVal;
    
    const numVal = getFieldValue(fieldName, context);
    if (numVal !== 0 || context.rowData?.[getColumnIdentifier(fieldName, context) || ''] !== undefined) {
      return numVal;
    }
    
    const textVal = getTextFieldValue(fieldName, context);
    if (textVal) return textVal;
    
    const dateVal = getDateValue(fieldName, context);
    if (dateVal) return dateVal;
    
    return null;
  }
};

// Parse and extract arguments from function call arguments string
export const parseFunctionArguments = (argsString: string): string[] => {
  if (!argsString?.trim()) return [];
  
  const args: string[] = [];
  let currentArg = '';
  let depth = 0;
  let inBraces = false;
  let inQuotes = false;
  let quoteChar = '';
  
  for (let i = 0; i < argsString.length; i++) {
    const char = argsString[i];
    const prevChar = i > 0 ? argsString[i - 1] : '';
    
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
        currentArg += char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        currentArg += char;
      } else {
        currentArg += char;
      }
    } else if (inQuotes) {
      currentArg += char;
    } else if (char === '{') {
      inBraces = true;
      currentArg += char;
    } else if (char === '}') {
      inBraces = false;
      currentArg += char;
    } else if (char === '(') {
      depth++;
      currentArg += char;
    } else if (char === ')') {
      depth--;
      currentArg += char;
    } else if (char === ',' && depth === 0 && !inBraces) {
      args.push(currentArg.trim());
      currentArg = '';
    } else {
      currentArg += char;
    }
  }
  
  if (currentArg.trim()) {
    args.push(currentArg.trim());
  }
  
  return args;
};

// Helper function to evaluate a single argument (field reference or number)
export const evaluateArgument = (
  arg: string,
  context: FormulaContext
): number | null => {
  const trimmedArg = arg.trim();
  
  if (trimmedArg.startsWith('{') && trimmedArg.endsWith('}')) {
    const fieldName = parseFieldReference(trimmedArg);
    return getFieldValue(fieldName, context);
  }
  
  if (isNumericLiteral(trimmedArg)) {
    return Number.parseFloat(trimmedArg);
  }
  
  if (startsWithFunctionCall(trimmedArg)) {
    return null;
  }
  
  const num = Number.parseFloat(trimmedArg);
  return Number.isNaN(num) ? null : num;
};

// Helper function to evaluate a single text argument
export const evaluateTextArgument = (
  arg: string,
  context: FormulaContext
): string | null => {
  const trimmedArg = arg.trim();
  
  if (trimmedArg.startsWith('{') && trimmedArg.endsWith('}')) {
    const fieldName = parseFieldReference(trimmedArg);
    return getTextFieldValue(fieldName, context);
  }
  
  if ((trimmedArg.startsWith('"') && trimmedArg.endsWith('"')) ||
      (trimmedArg.startsWith("'") && trimmedArg.endsWith("'"))) {
    const unquoted = trimmedArg.slice(1, -1);
    return unquoted.replaceAll(String.raw`\"`, '"').replaceAll(String.raw`\'`, "'").replaceAll(String.raw`\\`, '\\');
  }
  
  if (/^[A-Z_]+\(/.test(trimmedArg)) {
    return null;
  }
  
  return trimmedArg;
};

// Helper function to evaluate a single date argument
export const evaluateDateArgument = (
  arg: string,
  context: FormulaContext
): Date | null => {
  const trimmedArg = arg.trim();
  
  if (trimmedArg.startsWith('{') && trimmedArg.endsWith('}')) {
    const fieldName = parseFieldReference(trimmedArg);
    return getDateValue(fieldName, context);
  }
  
  if (/^[A-Z_]+\(/.test(trimmedArg)) {
    return null;
  }
  
  const date = new Date(trimmedArg);
  if (!Number.isNaN(date.getTime())) {
    return date;
  }
  
  return null;
};

// Math Functions Evaluation
export const evaluateADD = (formula: string, context: FormulaContext): number | null => {
  const addRegex = /\bADD\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(addRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return null;
  
  let sum = 0;
  for (const arg of args) {
    const argValue = evaluateArgument(arg, context);
    if (argValue === null) return null;
    sum += argValue;
  }
  
  return sum;
};

export const evaluateSUBTRACT = (formula: string, context: FormulaContext): number | null => {
  const subtractRegex = /SUBTRACT\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(subtractRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;
  
  const firstArg = evaluateArgument(args[0], context);
  if (firstArg === null) return null;
  
  let result = firstArg;
  for (let i = 1; i < args.length; i++) {
    const argValue = evaluateArgument(args[i], context);
    if (argValue === null) return null;
    result -= argValue;
  }
  
  return result;
};

export const evaluateMULTIPLY = (formula: string, context: FormulaContext): number | null => {
  const multiplyRegex = /MULTIPLY\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(multiplyRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;
  
  let result = 1;
  for (const arg of args) {
    const argValue = evaluateArgument(arg, context);
    if (argValue === null) return null;
    result *= argValue;
  }
  
  return result;
};

export const evaluateDIVIDE = (formula: string, context: FormulaContext): number | null => {
  const divideRegex = /DIVIDE\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(divideRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;
  
  const firstArg = evaluateArgument(args[0], context);
  if (firstArg === null) return null;
  
  let result = firstArg;
  for (let i = 1; i < args.length; i++) {
    const argValue = evaluateArgument(args[i], context);
    if (argValue === null || argValue === 0) return null;
    result /= argValue;
  }
  
  return result;
};

export const evaluateSUM = (formula: string, context: FormulaContext): number | null => {
  return evaluateADD(formula.replaceAll(/SUM\s*\(/gi, 'ADD('), context);
};

export const evaluateAVERAGE = (formula: string, context: FormulaContext): number | null => {
  const averageRegex = /AVERAGE\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(averageRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return null;
  
  let sum = 0;
  let count = 0;
  for (const arg of args) {
    const argValue = evaluateArgument(arg, context);
    if (argValue !== null) {
      sum += argValue;
      count++;
    }
  }
  
  return count > 0 ? sum / count : null;
};

export const evaluateMAX = (formula: string, context: FormulaContext): number | null => {
  const maxRegex = /MAX\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(maxRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return null;
  
  let maxValue: number | null = null;
  for (const arg of args) {
    const argValue = evaluateArgument(arg, context);
    if (argValue !== null) {
      if (maxValue === null || argValue > maxValue) {
        maxValue = argValue;
      }
    }
  }
  
  return maxValue;
};

export const evaluateMIN = (formula: string, context: FormulaContext): number | null => {
  const minRegex = /MIN\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(minRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return null;
  
  let minValue: number | null = null;
  for (const arg of args) {
    const argValue = evaluateArgument(arg, context);
    if (argValue !== null) {
      if (minValue === null || argValue < minValue) {
        minValue = argValue;
      }
    }
  }
  
  return minValue;
};

export const evaluateROUND = (formula: string, context: FormulaContext): number | null => {
  const roundRegex = /ROUND\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(roundRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const value = evaluateArgument(args[0], context);
  if (value === null) return null;
  
  const decimals = args.length > 1 ? evaluateArgument(args[1], context) : 0;
  if (decimals === null) return null;
  
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

export const evaluateCEILING = (formula: string, context: FormulaContext): number | null => {
  const ceilingRegex = /CEILING\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(ceilingRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const value = evaluateArgument(args[0], context);
  if (value === null) return null;
  
  return Math.ceil(value);
};

export const evaluateFLOOR = (formula: string, context: FormulaContext): number | null => {
  const floorRegex = /FLOOR\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(floorRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const value = evaluateArgument(args[0], context);
  if (value === null) return null;
  
  return Math.floor(value);
};

export const evaluateABS = (formula: string, context: FormulaContext): number | null => {
  const absRegex = /ABS\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(absRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const value = evaluateArgument(args[0], context);
  if (value === null) return null;
  
  return Math.abs(value);
};

export const evaluatePOWER = (formula: string, context: FormulaContext): number | null => {
  const powerRegex = /POWER\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(powerRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;
  
  const base = evaluateArgument(args[0], context);
  const exponent = evaluateArgument(args[1], context);
  if (base === null || exponent === null) return null;
  
  return Math.pow(base, exponent);
};

export const evaluateSQRT = (formula: string, context: FormulaContext): number | null => {
  const sqrtRegex = /SQRT\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(sqrtRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const value = evaluateArgument(args[0], context);
  if (value === null || value < 0) return null;
  
  return Math.sqrt(value);
};

export const evaluateMOD = (formula: string, context: FormulaContext): number | null => {
  const modRegex = /MOD\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(modRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;
  
  const dividend = evaluateArgument(args[0], context);
  const divisor = evaluateArgument(args[1], context);
  if (dividend === null || divisor === null || divisor === 0) return null;
  
  return dividend % divisor;
};

// Text Functions Evaluation
export const evaluateCONCATENATE = (formula: string, context: FormulaContext): string | null => {
  const concatRegex = /(?:CONCATENATE|CONCAT)\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(concatRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return '';
  
  const parts: string[] = [];
  for (const arg of args) {
    const argValue = evaluateTextArgument(arg, context);
    if (argValue === null) return null;
    parts.push(argValue);
  }
  
  return parts.join('');
};

export const evaluateLEN = (formula: string, context: FormulaContext): number | null => {
  const lenRegex = /LEN\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(lenRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;
  
  return textValue.length;
};

export const evaluateUPPER = (formula: string, context: FormulaContext): string | null => {
  const upperRegex = /UPPER\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(upperRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;
  
  return textValue.toUpperCase();
};

export const evaluateLOWER = (formula: string, context: FormulaContext): string | null => {
  const lowerRegex = /LOWER\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(lowerRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;
  
  return textValue.toLowerCase();
};

export const evaluateTRIM = (formula: string, context: FormulaContext): string | null => {
  const trimRegex = /TRIM\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(trimRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;
  
  return textValue.trim();
};

export const evaluateLEFT = (formula: string, context: FormulaContext): string | null => {
  const leftRegex = /LEFT\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(leftRegex)];
  if (matches.length === 0) return null;
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;

  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;

  const countValue = evaluateArgument(args[1], context);
  if (countValue === null) return null;
  const n = Math.max(0, Math.floor(countValue));

  return n <= 0 ? '' : textValue.slice(0, n);
};

export const evaluateRIGHT = (formula: string, context: FormulaContext): string | null => {
  const rightRegex = /RIGHT\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(rightRegex)];
  if (matches.length === 0) return null;
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;

  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;

  const countValue = evaluateArgument(args[1], context);
  if (countValue === null) return null;
  const n = Math.max(0, Math.floor(countValue));

  if (n <= 0) return '';
  if (n >= textValue.length) return textValue;
  return textValue.slice(textValue.length - n);
};

export const evaluateMID = (formula: string, context: FormulaContext): string | null => {
  const midRegex = /MID\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(midRegex)];
  if (matches.length === 0) return null;
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  const args = parseFunctionArguments(argsString);
  if (args.length < 3) return null;

  const textValue = evaluateTextArgument(args[0], context);
  if (textValue === null) return null;

  const startValue = evaluateArgument(args[1], context);
  const lengthValue = evaluateArgument(args[2], context);
  if (startValue === null || lengthValue === null) return null;

  const start = Math.max(1, Math.floor(startValue));
  const len = Math.max(0, Math.floor(lengthValue));

  const startIndex = Math.max(0, start - 1);
  if (len === 0) return '';
  return textValue.substring(startIndex, startIndex + len);
};

export const evaluateFIND = (formula: string, context: FormulaContext): number | null => {
  const findRegex = /FIND\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(findRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2) return null;
  
  const searchText = evaluateTextArgument(args[0], context);
  const withinText = evaluateTextArgument(args[1], context);
  if (searchText === null || withinText === null) return null;
  
  const position = withinText.indexOf(searchText);
  return position >= 0 ? position + 1 : 0;
};

export const evaluateREPLACE = (formula: string, context: FormulaContext): string | null => {
  const replaceRegex = /REPLACE\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(replaceRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 3) return null;
  
  const textValue = evaluateTextArgument(args[0], context);
  const oldText = evaluateTextArgument(args[1], context);
  const newText = evaluateTextArgument(args[2], context);
  if (textValue === null || oldText === null || newText === null) return null;
  
  const escaped = oldText.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return textValue.replaceAll(new RegExp(escaped, 'g'), newText);
};

// Date Functions Evaluation
export const evaluateTODAY = (): Date | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const evaluateNOW = (): Date | null => {
  return new Date();
};

export const evaluateYEAR = (formula: string, context: FormulaContext): number | null => {
  const yearRegex = /\bYEAR\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(yearRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const dateValue = evaluateDateArgument(args[0], context);
  if (dateValue === null) return null;
  
  return dateValue.getFullYear();
};

export const evaluateMONTH = (formula: string, context: FormulaContext): number | null => {
  const monthRegex = /\bMONTH\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(monthRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const dateValue = evaluateDateArgument(args[0], context);
  if (dateValue === null) return null;
  
  return dateValue.getMonth() + 1;
};

export const evaluateDAY = (formula: string, context: FormulaContext): number | null => {
  const dayRegex = /\bDAY\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(dayRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const dateValue = evaluateDateArgument(args[0], context);
  if (dateValue === null) return null;
  
  return dateValue.getDate();
};

export const evaluateWEEKDAY = (formula: string, context: FormulaContext): number | null => {
  const weekdayRegex = /\bWEEKDAY\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(weekdayRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const dateValue = evaluateDateArgument(args[0], context);
  if (dateValue === null) return null;
  
  const day = dateValue.getDay();
  return day === 0 ? 7 : day;
};

export const evaluateDATEADD = (formula: string, context: FormulaContext): Date | null => {
  const dateaddRegex = /\bDATEADD\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(dateaddRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 3) return null;
  
  const dateValue = evaluateDateArgument(args[0], context);
  if (dateValue === null) return null;
  
  const amount = evaluateArgument(args[1], context);
  if (amount === null) return null;
  
  const unitArg = args[2].trim();
  let unit = '';
  
  if ((unitArg.startsWith('"') && unitArg.endsWith('"')) ||
      (unitArg.startsWith("'") && unitArg.endsWith("'"))) {
    unit = unitArg.slice(1, -1).toLowerCase();
  } else if (unitArg.startsWith('{') && unitArg.endsWith('}')) {
    const fieldName = parseFieldReference(unitArg);
    const textValue = getTextFieldValue(fieldName, context);
    unit = textValue.toLowerCase();
  } else {
    unit = unitArg.toLowerCase();
  }
  
  const resultDate = new Date(dateValue);
  
  switch (unit) {
    case 'year':
    case 'years':
      resultDate.setFullYear(resultDate.getFullYear() + Math.floor(amount));
      break;
    case 'month':
    case 'months':
      resultDate.setMonth(resultDate.getMonth() + Math.floor(amount));
      break;
    case 'day':
    case 'days':
      resultDate.setDate(resultDate.getDate() + Math.floor(amount));
      break;
    case 'week':
    case 'weeks':
      resultDate.setDate(resultDate.getDate() + Math.floor(amount * 7));
      break;
    case 'hour':
    case 'hours':
      resultDate.setHours(resultDate.getHours() + Math.floor(amount));
      break;
    case 'minute':
    case 'minutes':
      resultDate.setMinutes(resultDate.getMinutes() + Math.floor(amount));
      break;
    case 'second':
    case 'seconds':
      resultDate.setSeconds(resultDate.getSeconds() + Math.floor(amount));
      break;
    default:
      return null;
  }
  
  return resultDate;
};

export const evaluateDATEDIFF = (formula: string, context: FormulaContext): number | null => {
  const datediffRegex = /\bDATEDIFF\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(datediffRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 3) return null;
  
  const date1 = evaluateDateArgument(args[0], context);
  if (date1 === null) return null;
  
  const date2 = evaluateDateArgument(args[1], context);
  if (date2 === null) return null;
  
  const unitArg = args[2].trim();
  let unit = '';
  
  if ((unitArg.startsWith('"') && unitArg.endsWith('"')) ||
      (unitArg.startsWith("'") && unitArg.endsWith("'"))) {
    unit = unitArg.slice(1, -1).toLowerCase();
  } else if (unitArg.startsWith('{') && unitArg.endsWith('}')) {
    const fieldName = parseFieldReference(unitArg);
    const textValue = getTextFieldValue(fieldName, context);
    unit = textValue.toLowerCase();
  } else {
    unit = unitArg.toLowerCase();
  }
  
  const diffMs = date2.getTime() - date1.getTime();
  
  switch (unit) {
    case 'year':
    case 'years':
      return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    case 'month':
    case 'months':
      return Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
    case 'week':
    case 'weeks':
      return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    case 'day':
    case 'days':
      return Math.floor(diffMs / (24 * 60 * 60 * 1000));
    case 'hour':
    case 'hours':
      return Math.floor(diffMs / (60 * 60 * 1000));
    case 'minute':
    case 'minutes':
      return Math.floor(diffMs / (60 * 1000));
    case 'second':
    case 'seconds':
      return Math.floor(diffMs / 1000);
    default:
      return null;
  }
};

export const evaluateDATE = (formula: string, context: FormulaContext): Date | null => {
  const dateRegex = /\bDATE\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(dateRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 3) return null;
  
  const year = evaluateArgument(args[0], context);
  if (year === null) return null;
  
  const month = evaluateArgument(args[1], context);
  if (month === null) return null;
  
  const day = evaluateArgument(args[2], context);
  if (day === null) return null;
  
  const yearInt = Math.floor(year);
  const monthInt = Math.floor(month);
  const dayInt = Math.floor(day);
  
  if (monthInt < 1 || monthInt > 12) return null;
  if (dayInt < 1 || dayInt > 31) return null;
  
  const resultDate = new Date(yearInt, monthInt - 1, dayInt);
  
  if (resultDate.getFullYear() !== yearInt ||
      resultDate.getMonth() !== monthInt - 1 ||
      resultDate.getDate() !== dayInt) {
    return null;
  }
  
  return resultDate;
};

// ============================================================================
// Comparison Helper Functions
// ============================================================================

// Parse a comparison operand (left or right side) into its value
const parseComparisonOperand = (operand: string, context: FormulaContext): any => {
  if (operand.startsWith('{') && operand.endsWith('}')) {
    const fieldName = parseFieldReference(operand);
    return getFieldValueByType(fieldName, context);
  } else if ((operand.startsWith('"') && operand.endsWith('"')) || (operand.startsWith("'") && operand.endsWith("'"))) {
    return operand.slice(1, -1);
  } else if (isNumericLiteral(operand)) {
    return Number.parseFloat(operand);
  } else {
    const lowerOperand = operand.toLowerCase();
    if (lowerOperand === 'true') {
      return true;
    } else if (lowerOperand === 'false') {
      return false;
    } else {
      const dateVal = new Date(operand);
      if (Number.isNaN(dateVal.getTime())) {
        return operand;
      } else {
        return dateVal;
      }
    }
  }
};

// Perform a comparison operation between two values
const performComparison = (leftValue: any, rightValue: any, operator: string): boolean | null => {
  if (leftValue === null || rightValue === null) {
    return null;
  }
  
  switch (operator) {
    case '=':
      return leftValue == rightValue;
    case '!=':
      return leftValue != rightValue;
    case '>':
      return leftValue > rightValue;
    case '<':
      return leftValue < rightValue;
    case '>=':
      return leftValue >= rightValue;
    case '<=':
      return leftValue <= rightValue;
    default:
      return null;
  }
};

// Check if an operator match is valid (not part of a larger operator like !=, >=, <=)
const isValidOperatorMatch = (trimmed: string, op: string, index: number): boolean => {
  if (index > 0) {
    const charBefore = trimmed[index - 1];
    if (op === '=' && charBefore === '!') return false;
  }
  if (op === '>' && index < trimmed.length - 1 && trimmed[index + 1] === '=') {
    return false;
  }
  if (op === '<' && index < trimmed.length - 1 && trimmed[index + 1] === '=') {
    return false;
  }
  return true;
};

// Logical Functions - Helper to evaluate a condition
export const evaluateCondition = (
  condition: string,
  context: FormulaContext
): boolean | null => {
  const trimmed = condition.trim();
  
  // Use COMPARISON_OPERATORS but create non-global regex for matching
  const operators = COMPARISON_OPERATORS.map(({ op, regex }) => ({
    op,
    regex: new RegExp(regex.source) // Remove global flag for single match
  }));
  
  for (const { op, regex } of operators) {
    const match = regex.exec(trimmed);
    if (match) {
      const index = match.index;
      
      if (!isValidOperatorMatch(trimmed, op, index)) {
        continue;
      }
      
      const left = trimmed.substring(0, index).trim();
      const right = trimmed.substring(index + op.length).trim();
      
      const leftValue = parseComparisonOperand(left, context);
      const rightValue = parseComparisonOperand(right, context);
      
      const result = performComparison(leftValue, rightValue, op);
      if (result !== null) {
        return result;
      }
    }
  }
  
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const fieldName = parseFieldReference(trimmed);
    const fieldType = getFieldType(fieldName, context);
    
    if (fieldType === 'boolean' || fieldType === 'checkbox') {
      const columnIdentifier = getColumnIdentifier(fieldName, context);
      if (context.rowData && columnIdentifier) {
        const val = context.rowData[columnIdentifier] ?? context.rowData.data?.[columnIdentifier];
        return Boolean(val);
      }
      return false;
    }
    
    const textVal = getTextFieldValue(fieldName, context);
    const numVal = getFieldValue(fieldName, context);
    const dateVal = getDateValue(fieldName, context);
    return !!(textVal || numVal !== 0 || dateVal);
  }
  
  const lowerTrimmed = trimmed.toLowerCase();
  if (lowerTrimmed === 'true') return true;
  if (lowerTrimmed === 'false') return false;
  
  return null;
};

export const evaluateIF = (formula: string, context: FormulaContext): any => {
  const ifRegex = /\bIF\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(ifRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 2 || args.length > 3) return null;
  
  const condition = args[0].trim();
  const conditionResult = evaluateCondition(condition, context);
  
  if (conditionResult === null) return null;
  
  const trueValue = args[1].trim();
  let trueResult: any = null;
  
  const falseValue = args.length > 2 ? args[2].trim() : '';
  let falseResult: any = null;
  
  if (trueValue.startsWith('{') && trueValue.endsWith('}')) {
    const fieldName = parseFieldReference(trueValue);
    const value = getFieldValueByType(fieldName, context);
    trueResult = value === null ? '' : value;
  } else if ((trueValue.startsWith('"') && trueValue.endsWith('"')) || (trueValue.startsWith("'") && trueValue.endsWith("'"))) {
    trueResult = trueValue.slice(1, -1);
  } else if (isNumericLiteral(trueValue)) {
    trueResult = Number.parseFloat(trueValue);
  } else {
    const lowerTrueValue = trueValue.toLowerCase();
    if (lowerTrueValue === 'true') {
      trueResult = true;
    } else if (lowerTrueValue === 'false') {
      trueResult = false;
    } else {
      const dateVal = new Date(trueValue);
      if (Number.isNaN(dateVal.getTime())) {
        trueResult = trueValue;
      } else {
        trueResult = dateVal;
      }
    }
  }
  
  if (falseValue) {
    if (falseValue.startsWith('{') && falseValue.endsWith('}')) {
      const fieldName = parseFieldReference(falseValue);
      const value = getFieldValueByType(fieldName, context);
      falseResult = value === null ? '' : value;
    } else if ((falseValue.startsWith('"') && falseValue.endsWith('"')) || (falseValue.startsWith("'") && falseValue.endsWith("'"))) {
      falseResult = falseValue.slice(1, -1);
    } else if (isNumericLiteral(falseValue)) {
      falseResult = Number.parseFloat(falseValue);
    } else {
      const lowerFalseValue = falseValue.toLowerCase();
      if (lowerFalseValue === 'true') {
        falseResult = true;
      } else if (lowerFalseValue === 'false') {
        falseResult = false;
      } else {
        const dateVal = new Date(falseValue);
        if (Number.isNaN(dateVal.getTime())) {
          falseResult = falseValue;
        } else {
          falseResult = dateVal;
        }
      }
    }
  } else {
    falseResult = '';
  }
  
  return conditionResult ? trueResult : falseResult;
};

export const evaluateAND = (formula: string, context: FormulaContext): boolean | null => {
  const andRegex = /\bAND\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(andRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return null;
  
  for (const arg of args) {
    const conditionResult = evaluateCondition(arg.trim(), context);
    if (conditionResult === null) return null;
    if (!conditionResult) return false;
  }
  
  return true;
};

export const evaluateOR = (formula: string, context: FormulaContext): boolean | null => {
  const orRegex = /\bOR\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(orRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length === 0) return null;
  
  for (const arg of args) {
    const conditionResult = evaluateCondition(arg.trim(), context);
    if (conditionResult === null) return null;
    if (conditionResult) return true;
  }
  
  return false;
};

export const evaluateNOT = (formula: string, context: FormulaContext): boolean | null => {
  const notRegex = /\bNOT\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(notRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const conditionResult = evaluateCondition(args[0].trim(), context);
  if (conditionResult === null) return null;
  
  return !conditionResult;
};

export const evaluateISBLANK = (formula: string, context: FormulaContext): boolean | null => {
  const isblankRegex = /\bISBLANK\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(isblankRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const arg = args[0].trim();
  
  if (arg.startsWith('{') && arg.endsWith('}')) {
    const fieldName = parseFieldReference(arg);
    const columnIdentifier = getColumnIdentifier(fieldName, context);
    
    if (context.rowData && columnIdentifier) {
      const val = context.rowData[columnIdentifier] ?? context.rowData.data?.[columnIdentifier];
      return val === null || val === undefined || val === '';
    }
    
    const textVal = getTextFieldValue(fieldName, context);
    const numVal = getFieldValue(fieldName, context);
    const dateVal = getDateValue(fieldName, context);
    return !textVal && numVal === 0 && !dateVal;
  }
  
  return !arg || arg === '';
};

export const evaluateISNUMBER = (formula: string, context: FormulaContext): boolean | null => {
  const isnumberRegex = /\bISNUMBER\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(isnumberRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const arg = args[0].trim();
  
  if (arg.startsWith('{') && arg.endsWith('}')) {
    const fieldName = parseFieldReference(arg);
    const fieldType = getFieldType(fieldName, context);
    return isNumericType(fieldType);
  }
  
  return isNumericLiteral(arg);
};

export const evaluateISTEXT = (formula: string, context: FormulaContext): boolean | null => {
  const istextRegex = /\bISTEXT\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(istextRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const arg = args[0].trim();
  
  if (arg.startsWith('{') && arg.endsWith('}')) {
    const fieldName = parseFieldReference(arg);
    const fieldType = getFieldType(fieldName, context);
    return isTextType(fieldType);
  }
  
  if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
    return true;
  }
  
  return !isNumericLiteral(arg);
};

export const evaluateISDATE = (formula: string, context: FormulaContext): boolean | null => {
  const isdateRegex = /\bISDATE\s*\(([^)]*)\)/gi;
  const matches = [...formula.matchAll(isdateRegex)];
  
  if (matches.length === 0) return null;
  
  const match = matches[0];
  const argsString = match[1].trim();
  if (!argsString) return null;
  
  const args = parseFunctionArguments(argsString);
  if (args.length < 1) return null;
  
  const arg = args[0].trim();
  
  if (arg.startsWith('{') && arg.endsWith('}')) {
    const fieldName = parseFieldReference(arg);
    const fieldType = getFieldType(fieldName, context);
    return isDateType(fieldType);
  }
  
  const dateVal = new Date(arg);
  return !Number.isNaN(dateVal.getTime());
};

// Evaluate comparison operators directly
export const evaluateComparison = (formula: string, context: FormulaContext): boolean | null => {
  const trimmed = formula.trim();
  
  // Use COMPARISON_OPERATORS but create non-global regex for matching
  const operators = COMPARISON_OPERATORS.map(({ op, regex }) => ({
    op,
    regex: new RegExp(regex.source) // Remove global flag for single match
  }));
  
  for (const { op, regex } of operators) {
    const match = regex.exec(trimmed);
    if (match) {
      const index = match.index;
      
      if (!isValidOperatorMatch(trimmed, op, index)) {
        continue;
      }
      
      // Check if operator is inside quotes or parentheses
      let inQuotes = false;
      let quoteChar = '';
      let parenDepth = 0;
      for (let i = 0; i < index; i++) {
        const char = trimmed[i];
        const prevChar = i > 0 ? trimmed[i - 1] : '';
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = '';
          }
        }
        if (!inQuotes) {
          if (char === '(' && prevChar !== '\\') parenDepth++;
          if (char === ')' && prevChar !== '\\') parenDepth--;
        }
      }
      if (inQuotes || parenDepth > 0) continue;
      
      const left = trimmed.substring(0, index).trim();
      const right = trimmed.substring(index + op.length).trim();
      
      const leftValue = parseComparisonOperand(left, context);
      const rightValue = parseComparisonOperand(right, context);
      
      const result = performComparison(leftValue, rightValue, op);
      if (result !== null) {
        return result;
      }
    }
  }
  
  return null;
};

// Evaluate a mathematical expression with operators (+, -, *, /)
// Supports multiple operands: {Price} + {Tax} + {Shipping}, {Price} * {Quantity} * 1.1, etc.
// Supports field references, numeric literals, parentheses, and proper operator precedence
const evaluateMathExpression = (formula: string, context: FormulaContext): number | null => {
  const trimmed = formula.trim();
  
  // Check if formula contains any math operators
  const hasMathOperator = /[+\-*/]/.test(trimmed);
  if (!hasMathOperator) {
    return null;
  }
  
  // Check if formula contains function calls - if so, don't treat as simple math expression
  // (functions should be evaluated first)
  if (containsFunctionCallToken(trimmed)) {
    return null;
  }
  
  try {
    // Parse and evaluate the expression
    return parseAndEvaluateExpression(trimmed, context);
  } catch (error) {
    // Expression evaluation failed - could be malformed expression or invalid operation
    // Examples: division by zero, invalid field references, or parsing errors
    console.error('Formula evaluation error:', error);
    return null;
  }
};

// Parse and evaluate a mathematical expression with proper precedence
const parseAndEvaluateExpression = (expression: string, context: FormulaContext): number | null => {
  // Remove whitespace
  let expr = expression.replaceAll(/\s+/g, '');
  
  // Handle parentheses first
  while (expr.includes('(')) {
    const openParen = expr.lastIndexOf('(');
    if (openParen === -1) break;
    
    let closeParen = -1;
    let depth = 1;
    for (let i = openParen + 1; i < expr.length; i++) {
      if (expr[i] === '(') depth++;
      if (expr[i] === ')') depth--;
      if (depth === 0) {
        closeParen = i;
        break;
      }
    }
    
    if (closeParen === -1) return null;
    
    const innerExpr = expr.substring(openParen + 1, closeParen);
    const innerResult = parseAndEvaluateExpression(innerExpr, context);
    if (innerResult === null) return null;
    
    expr = expr.substring(0, openParen) + innerResult.toString() + expr.substring(closeParen + 1);
  }
  
  // Tokenize the expression
  const tokens: Array<{ type: 'number' | 'operator'; value: string | number }> = [];
  let i = 0;
  
  while (i < expr.length) {
    const char = expr[i];
    
    // Handle operators
    if (['+', '-', '*', '/'].includes(char)) {
      // Check if it's a unary minus or plus (at start or after operator)
      if ((char === '-' || char === '+') && (tokens.length === 0 || tokens.at(-1)?.type === 'operator')) {
        // This is a unary minus/plus, start reading a signed number
        i++;
        let numStr = char === '-' ? '-' : '';
        while (i < expr.length && /[\d.]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        // If we found digits, it's a signed number
        if (numStr !== '' && numStr !== '-') {
          const num = Number.parseFloat(numStr);
          if (Number.isNaN(num)) return null;
          tokens.push({ type: 'number', value: num });
          continue;
        }
        // If no digits found, it's an invalid expression
        return null;
      }
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }
    
    // Handle field references {FieldName}
    if (char === '{') {
      const closeBrace = expr.indexOf('}', i);
      if (closeBrace === -1) return null;
      const fieldName = expr.substring(i + 1, closeBrace);
      const fieldValue = getFieldValue(fieldName, context);
      tokens.push({ type: 'number', value: fieldValue });
      i = closeBrace + 1;
      continue;
    }
    
    // Handle numbers
    if (/[\d.]/.test(char)) {
      let numStr = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      const num = Number.parseFloat(numStr);
      if (Number.isNaN(num)) return null;
      tokens.push({ type: 'number', value: num });
      continue;
    }
    
    // Unknown character
    return null;
  }
  
  if (tokens.length === 0) return null;
  
  // Evaluate with operator precedence: * and / first, then + and -
  // First pass: handle * and / (supports multiple operands)
  const processed: Array<{ type: 'number' | 'operator'; value: string | number }> = [];
  i = 0;
  
  while (i < tokens.length) {
    const token = tokens[i];
    
    // If we encounter * or /, evaluate immediately (left-associative)
    if (token.type === 'operator' && (token.value === '*' || token.value === '/')) {
      // Need a left operand from processed array
      if (processed.length === 0 || processed.at(-1)?.type !== 'number') {
        return null;
      }
      const left = processed.at(-1)?.value as number;
      
      // Get the right operand
      i++;
      if (i >= tokens.length || tokens[i].type !== 'number') {
        return null;
      }
      const right = tokens[i].value as number;
      
      // Perform the operation
      let result: number;
      if (token.value === '*') {
        result = left * right;
      } else {
        if (right === 0) return null; // Division by zero
        result = left / right;
      }
      
      // Replace the left operand with the result (supports chaining: a * b * c)
      processed[processed.length - 1] = { type: 'number', value: result };
      i++;
    } else {
      // Not a * or / operator, just add to processed array
      processed.push(token);
      i++;
    }
  }
  
  // Second pass: handle + and - (supports multiple operands)
  // Ensure we start with a number
  if (processed.length === 0 || processed[0].type !== 'number') {
    return null;
  }
  
  let result = processed[0].value as number;
  i = 1;
  
  // Process all remaining operators and operands (supports multiple operands)
  while (i < processed.length) {
    // Expect an operator
    if (processed[i].type !== 'operator') {
      return null;
    }
    const operator = processed[i].value as string;
    
    // Move to next token (the operand)
    i++;
    if (i >= processed.length || processed[i].type !== 'number') {
      return null;
    }
    const operand = processed[i].value as number;
    
    // Apply the operation (supports chaining multiple + and - operations)
    if (operator === '+') {
      result += operand;
    } else if (operator === '-') {
      result -= operand;
    } else {
      // This shouldn't happen after first pass, but handle it gracefully
      return null;
    }
    
    // Move to next token
    i++;
  }
  
  return result;
};

// Main evaluation function
// Main evaluation function
export const evaluateFormula = (
  formula: string,
  context: FormulaContext,
  validateFormulaFn: (formula: string, context: FormulaContext) => string | null
): { result: any; error: string | null } => {
  if (!formula.trim()) {
    return { result: null, error: null };
  }
  
  const error = validateFormulaFn(formula, context);
  if (error) {
    return { result: null, error };
  }
  
  // Array of evaluation functions to try in order
  // Each entry is [evaluator, optional condition function]
  const evaluators: Array<[
    (formula: string, context: FormulaContext) => any,
    ((formula: string) => boolean) | null
  ]> = [
    [evaluateABS, null],
    [evaluateSQRT, null],
    [evaluateCEILING, null],
    [evaluateFLOOR, null],
    [evaluateROUND, null],
    [evaluatePOWER, null],
    [evaluateMOD, null],
    [evaluateDIVIDE, null],
    [evaluateSUBTRACT, null],
    [evaluateMULTIPLY, null],
    [evaluateADD, null],
    [evaluateSUM, null],
    [evaluateAVERAGE, null],
    [evaluateMAX, null],
    [evaluateMIN, null],
    [evaluateCONCATENATE, null],
    [evaluateUPPER, null],
    [evaluateLOWER, null],
    [evaluateTRIM, null],
    [evaluateLEFT, null],
    [evaluateRIGHT, null],
    [evaluateMID, null],
    [evaluateLEN, null],
    [evaluateFIND, null],
    [evaluateREPLACE, null],
    [() => evaluateTODAY(), (formula: string) => formula.includes('TODAY()')],
    [() => evaluateNOW(), (formula: string) => formula.includes('NOW()')],
    [evaluateDATEADD, null],
    [evaluateDATEDIFF, null],
    [evaluateYEAR, null],
    [evaluateMONTH, null],
    [evaluateWEEKDAY, null],
    [evaluateDAY, null],
    [evaluateDATE, null],
    [evaluateISBLANK, null],
    [evaluateISNUMBER, null],
    [evaluateISTEXT, null],
    [evaluateISDATE, null],
    [evaluateAND, null],
    [evaluateOR, null],
    [evaluateNOT, null],
    [evaluateIF, null],
    [evaluateComparison, null]
  ];
  
  // Try each evaluator in order
  for (const [evaluator, condition] of evaluators) {
    if (condition && !condition(formula)) {
      continue;
    }
    const result = evaluator(formula, context);
    if (result !== null) {
      return { result, error: null };
    }
  }
  
  // Fallback: try evaluating mathematical expressions with operators (+, -, *, /)
  // Supports multiple operands: {Price} + {Tax} + {Shipping}, {Price} * {Quantity} * 1.1, etc.
  const mathResult = evaluateMathExpression(formula, context);
  if (mathResult !== null) {
    return { result: mathResult, error: null };
  }
  
  return { result: null, error: null };
};

// Format the result based on formatting type
export const formatResult = (
  result: any,
  formattingType: string,
  precision: number,
  config: any,
  formulaText: string
): string => {
  if (result === null || result === undefined) {
    return '';
  }
  
  if (typeof result === 'boolean') {
    return result ? 'TRUE' : 'FALSE';
  }
  
  if (result instanceof Date) {
    if (formattingType === 'date' && config?.formatting?.dateFormat) {
      return result.toLocaleDateString();
    }
    if (formulaText.includes('NOW()')) {
      return result.toLocaleString();
    }
    return result.toLocaleDateString();
  }
  
  if (typeof result === 'number') {
    if (['number', 'currency', 'percent'].includes(formattingType)) {
      const formatted = result.toFixed(precision);
      
      if (formattingType === 'currency') {
        const currency = config?.formatting?.currency || 'USD';
        const symbol = CURRENCY_SYMBOLS[currency] || currency;
        return `${symbol}${formatted}`;
      }
      
      if (formattingType === 'percent') {
        return `${formatted}%`;
      }
      
      return formatted;
    }
    return result.toString();
  }
  
  return String(result);
};

// Helper to check if formula depends on rowData
export const formulaDependsOnRowData = (formula: string): boolean => {
  return extractFieldReferences(formula).length > 0;
};

// Helper to check if formula uses TODAY()
export const formulaUsesToday = (formula: string): boolean => {
  const todayRegex = /\bTODAY\s*\(\s*\)/i;
  return todayRegex.test(formula);
};

// Get function syntax
export const getFunctionSyntax = (funcName: string, example: string): string => {
  const baseName = funcName.replaceAll('()', '');
  
  if (FUNCTION_SYNTAX_MAP[baseName]) {
    return FUNCTION_SYNTAX_MAP[baseName];
  }
  
  if (example) {
      const args = getFirstParenContent(example);
    if (args) {
      const fieldRefs = extractFieldReferences(args);
      if (fieldRefs.length === 1) {
        return `${baseName}(number)`;
      } else if (fieldRefs.length === 2) {
        return `${baseName}(number1, number2)`;
      }
    }
  }
  
  return `${baseName}(...)`;
};

// Detect the primary function being used in the formula
export const detectCurrentFunction = (formula: string): { name: string; description: string; example: string } | null => {
  if (!formula.trim()) return null;
  
  const allFunctions: Array<{ name: string; description: string; example: string }> = [];
  Object.values(FORMULA_FUNCTIONS).forEach(category => {
    allFunctions.push(...category);
  });
  
  for (const func of allFunctions) {
    if (!func.name.includes('(')) continue;
    
    const funcName = func.name.replace('()', '').toUpperCase();
    const regex = new RegExp(String.raw`\b${funcName}\s*\(`, 'i');
    if (regex.test(formula)) {
      return func;
    }
  }
  
  const multiCharOperators = ['!=', '>=', '<='];
  for (const op of multiCharOperators) {
    if (formula.includes(op)) {
      const operatorFunc = allFunctions.find(f => f.name === op);
      if (operatorFunc) {
        return operatorFunc;
      }
    }
  }
  
  const singleCharOperators = ['+', '*', '/', '^', '%', '=', '>', '<'];
  for (const op of singleCharOperators) {
    const escapedOp = op.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const regex = new RegExp(`[}\\d]\\s*\\${escapedOp}\\s*[{\\d]`, 'g');
    if (regex.test(formula)) {
      const operatorFunc = allFunctions.find(f => f.name === op);
      if (operatorFunc) {
        return operatorFunc;
      }
    }
  }
  
  if (formula.includes('-')) {
    const subtractionRegex = /[}\d]\s*-\s*[{\d]/;
    if (subtractionRegex.test(formula)) {
      const operatorFunc = allFunctions.find(f => f.name === '-');
      if (operatorFunc) {
        return operatorFunc;
      }
    }
  }
  
  return null;
};

// Detect which function is at the cursor position (or most recent function before cursor)
export const getFunctionAtCursor = (formula: string, cursorPosition: number): string | null => {
  if (!formula || cursorPosition < 0 || cursorPosition > formula.length) return null;
  
  const textBeforeCursor = formula.substring(0, cursorPosition);
  
  // Find the most recent function call before the cursor
  // Look for function patterns like ADD(, SUM(, CONCAT(, etc.
  const functionPattern = /\b([A-Z_][A-Z0-9_]*)\s*\(/gi;
  let lastMatch: RegExpMatchArray | null = null;
  let match: RegExpMatchArray | null;
  
  while ((match = functionPattern.exec(textBeforeCursor)) !== null) {
    lastMatch = match;
  }
  
  if (lastMatch) {
    return lastMatch[1].toUpperCase();
  }
  
  // Also check for math operators (+, -, *, /) which require numeric fields
  const hasMathOperator = /[+\-*/]/.test(textBeforeCursor);
  if (hasMathOperator) {
    // Check if we're inside a function or just using operators
    const openParens = (textBeforeCursor.match(/\(/g) || []).length;
    const closeParens = (textBeforeCursor.match(/\)/g) || []).length;
    const parenDepth = openParens - closeParens;
    
    // If not inside a function, math operators require numeric fields
    if (parenDepth === 0) {
      return 'MATH_OPERATOR';
    }
  }
  
  return null;
};

// Get compatible field types for a function
export const getCompatibleFieldTypes = (functionName: string | null): string[] | null => {
  if (!functionName) return null;
  
  if (functionName === 'MATH_OPERATOR') {
    return NUMERIC_TYPES;
  }
  
  if (MATH_FUNCTION_NAMES.includes(functionName)) {
    return NUMERIC_TYPES;
  }
  
  if (TEXT_FUNCTION_NAMES.includes(functionName)) {
    return TEXT_TYPES;
  }
  
  if (DATE_FUNCTION_NAMES.includes(functionName)) {
    return DATE_TYPES;
  }
  
  // For logical functions (IF, AND, OR, etc.), allow all types
  // For comparison operators, allow all types
  return null; // null means show all fields
};

// ============================================================================
// Validation Helper Functions
// ============================================================================

// Check if a position in formula is inside quotes
const isInsideQuotes = (formula: string, index: number): boolean => {
  let inDoubleQuotes = false;
  let inSingleQuotes = false;
  for (let i = 0; i < index; i++) {
    const char = formula[i];
    const prevChar = i > 0 ? formula[i - 1] : '';
    if (char === '"' && prevChar !== '\\') {
      if (!inSingleQuotes) {
        inDoubleQuotes = !inDoubleQuotes;
      }
    } else if (char === "'" && prevChar !== '\\') {
      if (!inDoubleQuotes) {
        inSingleQuotes = !inSingleQuotes;
      }
    }
  }
  return inDoubleQuotes || inSingleQuotes;
};

// Check if a position in formula is inside function parentheses
const isInsideFunctionParens = (formula: string, index: number): boolean => {
  let parenDepth = 0;
  for (let i = 0; i < index; i++) {
    const char = formula[i];
    const prevChar = i > 0 ? formula[i - 1] : '';
    if (char === '(' && prevChar !== '\\') {
      parenDepth++;
    } else if (char === ')' && prevChar !== '\\') {
      parenDepth--;
    }
  }
  return parenDepth > 0;
};

// Check if text contains any operator
const hasOperator = (text: string, operators: string[]): boolean => {
  for (const op of operators) {
    if (text.includes(op)) {
      return true;
    }
  }
  return false;
};

// ============================================================================
// Validation Functions
// ============================================================================

// Validate basic syntax (parentheses, quotes)
const validateBasicSyntax = (formula: string): string | null => {
  if (!formula.trim()) return null;
  
  // Check parentheses balance
  const openParens = countChar(formula, '(');
  const closeParens = countChar(formula, ')');
  if (openParens !== closeParens) {
    return 'Mismatched parentheses';
  }
  
  // Validate quoted strings are properly closed
  let inDoubleQuotes = false;
  let inSingleQuotes = false;
  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    const prevChar = i > 0 ? formula[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      if (!inSingleQuotes) {
        inDoubleQuotes = !inDoubleQuotes;
      }
    } else if (char === "'" && prevChar !== '\\') {
      if (!inDoubleQuotes) {
        inSingleQuotes = !inSingleQuotes;
      }
    }
  }
  
  if (inDoubleQuotes) {
    return 'Unclosed double-quoted string. Make sure all " characters are properly closed.';
  }
  if (inSingleQuotes) {
    return "Unclosed single-quoted string. Make sure all ' characters are properly closed.";
  }
  
  return null;
};

// Validate compound statements (multiple expressions without operators)
const validateCompoundStatements = (formula: string): string | null => {
  const operators = ['+', '-', '*', '/', '^', '%', '=', '!=', '>=', '<=', '>', '<'];

  const checkBetween = (startIndex: number, endIndex: number): string | null => {
    const betweenText = formula.slice(startIndex + 1, endIndex);
    if (!hasOperator(betweenText, operators)) {
      return 'Compound expressions are not supported.';
    }
    return null;
  };

  for (let i = 0; i < formula.length; i++) {
    const ch = formula[i];
    if (ch === ')') {
      let j = i + 1;
      while (j < formula.length && isWhitespaceChar(formula[j])) j++;
      if (j < formula.length && isIdentStart(formula[j])) {
        let k = j + 1;
        while (k < formula.length && isIdentChar(formula[k])) k++;
        while (k < formula.length && isWhitespaceChar(formula[k])) k++;
        if (k < formula.length && formula[k] === '(') {
          if (!isInsideQuotes(formula, i) && !isInsideFunctionParens(formula, i)) {
            const error = checkBetween(i, k);
            if (error) return error;
          }
        }
      }
      if (j < formula.length && formula[j] === '{') {
        if (!isInsideQuotes(formula, i) && !isInsideFunctionParens(formula, i)) {
          const error = checkBetween(i, j);
          if (error) return error;
        }
      }
    }
    if (ch === '}') {
      let j = i + 1;
      while (j < formula.length && isWhitespaceChar(formula[j])) j++;
      if (j < formula.length && formula[j] === '{') {
        if (!isInsideQuotes(formula, i) && !isInsideFunctionParens(formula, i)) {
          const error = checkBetween(i, j);
          if (error) return error;
        }
      }
      if (j < formula.length && isIdentStart(formula[j])) {
        let k = j + 1;
        while (k < formula.length && isIdentChar(formula[k])) k++;
        while (k < formula.length && isWhitespaceChar(formula[k])) k++;
        if (k < formula.length && formula[k] === '(') {
          if (!isInsideQuotes(formula, i) && !isInsideFunctionParens(formula, i)) {
            const error = checkBetween(i, k);
            if (error) return error;
          }
        }
      }
    }
  }

  // Check that only one function call is allowed at a time
  const allFunctionCalls = findFunctionCalls(formula, ALL_FUNCTION_NAMES)
    .filter(call => !isInsideQuotes(formula, call.index))
    .map(call => ({ name: call.name, index: call.index }));
  
  // Count top-level function calls
  let topLevelFunctionCount = 0;
  for (const funcCall of allFunctionCalls) {
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = '';
    
    for (let i = 0; i < funcCall.index; i++) {
      const char = formula[i];
      const prevChar = i > 0 ? formula[i - 1] : '';
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = '';
        }
      }
      if (!inQuotes) {
        if (char === '(' && prevChar !== '\\') parenDepth++;
        if (char === ')' && prevChar !== '\\') parenDepth--;
      }
    }
    
    if (parenDepth === 0) {
      topLevelFunctionCount++;
    }
  }
  
  if (topLevelFunctionCount > 1) {
    return 'Only one function call is allowed at a time. Compound expressions are not supported.';
  }
  
  return null;
};

// Validate field references
const validateFieldReferences = (formula: string, context: FormulaContext): string | null => {
  const { columns, allColumns } = context;
  
  const fieldRefs = extractFieldReferences(formula);
  const searchColumns = allColumns.length > 0 ? allColumns : columns;
  
  const validFieldNames = new Set<string>();
  searchColumns.forEach(col => {
    if (col.title) validFieldNames.add(col.title);
    if (col.name) validFieldNames.add(col.name);
    if (col.column_name) validFieldNames.add(col.column_name);
  });
  
  for (const ref of fieldRefs) {
    const fieldName = ref.slice(1, -1).trim();
    if (fieldName && !validFieldNames.has(fieldName)) {
      if (!isNumericLiteral(fieldName)) {
        return `Unknown field: ${fieldName}`;
      }
    }
  }
  
  return null;
};

// Validate math functions
const validateMathFunctions = (formula: string, context: FormulaContext): string | null => {
  for (const funcName of MATH_FUNCTION_NAMES) {
    const calls = findFunctionCalls(formula, [funcName]);
    
    for (const call of calls) {
      if (!call.args) {
        if (['SUM', 'AVERAGE', 'MAX', 'MIN'].includes(funcName)) {
          continue;
        }
      }

      const argsString = call.args || '';
      const args = parseFunctionArguments(argsString);
      
      for (const arg of args) {
        const trimmedArg = arg.trim();
        
        if (trimmedArg.startsWith('{') && trimmedArg.endsWith('}')) {
          const fieldName = parseFieldReference(trimmedArg);
          
          if (!isNumericLiteral(fieldName)) {
            const fieldType = getFieldType(fieldName, context);
            if (!isNumericType(fieldType)) {
              return `${funcName}() requires numeric fields. "${fieldName}" is a ${fieldType || 'non-numeric'} field`;
            }
          }
        } else if (!isNumericLiteral(trimmedArg)) {
          if (trimmedArg && !startsWithFunctionCall(trimmedArg)) {
            return `${funcName}() requires numeric values. "${trimmedArg}" is not numeric`;
          }
        }
      }
    }
  }
  
  return null;
};

// Validate text functions
const validateTextFunctions = (formula: string, context: FormulaContext): string | null => {
  for (const funcName of TEXT_FUNCTION_NAMES) {
    const funcNames = funcName === 'CONCATENATE' ? ['CONCATENATE', 'CONCAT'] : [funcName];
    const matches = findFunctionCalls(formula, funcNames);
    
    for (const match of matches) {
      const argsString = match.args || '';
      const args = parseFunctionArguments(argsString);
      
      if (funcName === 'CONCATENATE' || funcName === 'CONCAT') {
        if (args.length === 0) {
          return `${funcName}() requires at least 1 argument`;
        }
      } else if (['LEN', 'UPPER', 'LOWER', 'TRIM'].includes(funcName)) {
        if (args.length < 1) {
          return `${funcName}() requires 1 argument`;
        }
        if (args.length > 1) {
          return `${funcName}() accepts only 1 argument, but ${args.length} provided`;
        }
      } else if (funcName === 'FIND') {
        if (args.length < 2) {
          return `${funcName}() requires 2 arguments: FIND("search_text", {Text})`;
        }
        if (args.length > 2) {
          return `${funcName}() accepts only 2 arguments, but ${args.length} provided`;
        }
      } else if (funcName === 'REPLACE') {
        if (args.length < 3) {
          return `${funcName}() requires 3 arguments: REPLACE({Text}, "old", "new")`;
        }
        if (args.length > 3) {
          return `${funcName}() accepts only 3 arguments, but ${args.length} provided`;
        }
      }
      
      if (['LEFT', 'RIGHT'].includes(funcName)) {
        if (args.length !== 2) {
          return `${funcName}() requires 2 arguments: ${funcName}({Text}, 5)`;
        }
        const countArg = args[1].trim();
        if (countArg.startsWith('{') && countArg.endsWith('}')) {
          const fieldName = parseFieldReference(countArg);
          if (!isNumericLiteral(fieldName)) {
            const fieldType = getFieldType(fieldName, context);
            if (!isNumericType(fieldType)) {
              return `${funcName}() second argument must be numeric or numeric field reference`;
            }
          }
        } else if (!isNumericLiteral(countArg)) {
          return `${funcName}() second argument must be a number`;
        }
      }
      
      if (funcName === 'MID') {
        if (args.length < 3) {
          return `${funcName}() requires 3 arguments: MID({Text}, start, length)`;
        }
        if (args.length > 3) {
          return `${funcName}() accepts only 3 arguments, but ${args.length} provided`;
        }
        
        const startArg = args[1].trim();
        const lenArg = args[2].trim();
        
        const checkNumericArg = (argStr: string) => {
          if (argStr.startsWith('{') && argStr.endsWith('}')) {
            const fieldName = parseFieldReference(argStr);
            if (!isNumericLiteral(fieldName)) {
              const fieldType = getFieldType(fieldName, context);
              if (!isNumericType(fieldType)) return false;
            }
            return true;
          }
          return isNumericLiteral(argStr);
        };
        
        if (!checkNumericArg(startArg)) {
          return `${funcName}() second argument (start) must be numeric`;
        }
        if (!checkNumericArg(lenArg)) {
          return `${funcName}() third argument (length) must be numeric`;
        }
      }
    }
  }
  
  return null;
};

// Validate date functions
const validateDateFunctions = (formula: string, context: FormulaContext): string | null => {
  for (const funcName of DATE_FUNCTION_NAMES) {
    const matches = findFunctionCalls(formula, [funcName]);
    
    for (const match of matches) {
      const argsString = match.args || '';
      const args = parseFunctionArguments(argsString);
      
      if (['TODAY', 'NOW'].includes(funcName)) {
        if (args.length > 0) {
          return `${funcName}() accepts no arguments, but ${args.length} provided`;
        }
      } else if (['YEAR', 'MONTH', 'DAY', 'WEEKDAY'].includes(funcName)) {
        if (args.length < 1) {
          return `${funcName}() requires 1 argument: ${funcName}({Date})`;
        }
        if (args.length > 1) {
          return `${funcName}() accepts only 1 argument, but ${args.length} provided`;
        }
        
        const firstArg = args[0].trim();
        if (firstArg.startsWith('{') && firstArg.endsWith('}')) {
          const fieldName = parseFieldReference(firstArg);
          if (isNumericLiteral(fieldName)) {
            return `${funcName}() requires a date field, not a numeric literal`;
          } else {
            const fieldType = getFieldType(fieldName, context);
            if (!isDateType(fieldType)) {
              return `${funcName}() requires a date field. "${fieldName}" is a ${fieldType || 'non-date'} field`;
            }
          }
        } else {
          const testDate = new Date(firstArg);
          if (Number.isNaN(testDate.getTime())) {
            return `${funcName}() requires a date field reference (e.g., {Date}) or valid date string`;
          }
        }
      } else if (funcName === 'DATEADD') {
        if (args.length < 3) {
          return `${funcName}() requires 3 arguments: ${funcName}({Date}, number, "unit")`;
        }
        if (args.length > 3) {
          return `${funcName}() accepts only 3 arguments, but ${args.length} provided`;
        }
        
        const firstArg = args[0].trim();
        if (firstArg.startsWith('{') && firstArg.endsWith('}')) {
          const fieldName = parseFieldReference(firstArg);
          if (isNumericLiteral(fieldName)) {
            return `${funcName}() first argument requires a date field, not a numeric literal`;
          } else {
            const fieldType = getFieldType(fieldName, context);
            if (!isDateType(fieldType)) {
              return `${funcName}() first argument requires a date field. "${fieldName}" is a ${fieldType || 'non-date'} field`;
            }
          }
        } else {
          const testDate = new Date(firstArg);
          if (Number.isNaN(testDate.getTime())) {
            return `${funcName}() first argument must be a date field reference (e.g., {Date}) or valid date string`;
          }
        }
        
        const secondArg = args[1].trim();
        if (secondArg.startsWith('{') && secondArg.endsWith('}')) {
          const fieldName = parseFieldReference(secondArg);
          if (!isNumericLiteral(fieldName)) {
            const fieldType = getFieldType(fieldName, context);
            if (!isNumericType(fieldType)) {
              return `${funcName}() second argument must be numeric. "${fieldName}" is a ${fieldType || 'non-numeric'} field`;
            }
          }
        } else if (!isNumericLiteral(secondArg)) {
          return `${funcName}() second argument must be a number`;
        }
        
        const thirdArg = args[2].trim();
        const isQuoted = (thirdArg.startsWith('"') && thirdArg.endsWith('"')) ||
                        (thirdArg.startsWith("'") && thirdArg.endsWith("'"));
        if (!isQuoted && !thirdArg.startsWith('{')) {
          return `${funcName}() third argument must be a quoted string (e.g., "day", "month", "year") or text field reference`;
        }
        
        if (isQuoted) {
          const unit = thirdArg.slice(1, -1).toLowerCase();
          if (!VALID_DATE_UNITS.includes(unit)) {
            return `${funcName}() third argument must be a valid time unit: "year", "month", "day", "week", "hour", "minute", or "second"`;
          }
        }
      } else if (funcName === 'DATEDIFF') {
        if (args.length < 3) {
          return `${funcName}() requires 3 arguments: ${funcName}({Date1}, {Date2}, "unit")`;
        }
        if (args.length > 3) {
          return `${funcName}() accepts only 3 arguments, but ${args.length} provided`;
        }
        
        const firstArg = args[0].trim();
        if (firstArg.startsWith('{') && firstArg.endsWith('}')) {
          const fieldName = parseFieldReference(firstArg);
          if (isNumericLiteral(fieldName)) {
            return `${funcName}() first argument requires a date field, not a numeric literal`;
          } else {
            const fieldType = getFieldType(fieldName, context);
            if (!isDateType(fieldType)) {
              return `${funcName}() first argument requires a date field. "${fieldName}" is a ${fieldType || 'non-date'} field`;
            }
          }
        } else {
          const testDate = new Date(firstArg);
          if (Number.isNaN(testDate.getTime())) {
            return `${funcName}() first argument must be a date field reference (e.g., {Date}) or valid date string`;
          }
        }
        
        const secondArg = args[1].trim();
        if (secondArg.startsWith('{') && secondArg.endsWith('}')) {
          const fieldName = parseFieldReference(secondArg);
          if (isNumericLiteral(fieldName)) {
            return `${funcName}() second argument requires a date field, not a numeric literal`;
          } else {
            const fieldType = getFieldType(fieldName, context);
            if (!isDateType(fieldType)) {
              return `${funcName}() second argument requires a date field. "${fieldName}" is a ${fieldType || 'non-date'} field`;
            }
          }
        } else {
          const testDate = new Date(secondArg);
          if (Number.isNaN(testDate.getTime())) {
            return `${funcName}() second argument must be a date field reference (e.g., {Date}) or valid date string`;
          }
        }
        
        const thirdArg = args[2].trim();
        const isQuoted = (thirdArg.startsWith('"') && thirdArg.endsWith('"')) ||
                        (thirdArg.startsWith("'") && thirdArg.endsWith("'"));
        if (!isQuoted && !thirdArg.startsWith('{')) {
          return `${funcName}() third argument must be a quoted string (e.g., "day", "month", "year") or text field reference`;
        }
        
        if (isQuoted) {
          const unit = thirdArg.slice(1, -1).toLowerCase();
          if (!VALID_DATE_UNITS.includes(unit)) {
            return `${funcName}() third argument must be a valid time unit: "year", "month", "day", "week", "hour", "minute", or "second"`;
          }
        }
      } else if (funcName === 'DATE') {
        if (args.length < 3) {
          return `${funcName}() requires 3 arguments: ${funcName}(year, month, day)`;
        }
        if (args.length > 3) {
          return `${funcName}() accepts only 3 arguments, but ${args.length} provided`;
        }
        
        for (let i = 0; i < 3; i++) {
          const arg = args[i].trim();
          if (arg.startsWith('{') && arg.endsWith('}')) {
            const fieldName = parseFieldReference(arg);
            if (!isNumericLiteral(fieldName)) {
              const fieldType = getFieldType(fieldName, context);
              if (!isNumericType(fieldType)) {
                return `${funcName}() argument ${i + 1} must be numeric. "${fieldName}" is a ${fieldType || 'non-numeric'} field`;
              }
            }
          } else if (!isNumericLiteral(arg)) {
            return `${funcName}() argument ${i + 1} must be a number`;
          }
        }
        
        const monthArg = args[1].trim();
        const dayArg = args[2].trim();
        
        if (!monthArg.startsWith('{')) {
          const monthValue = Number.parseFloat(monthArg);
          if (!Number.isNaN(monthValue) && (monthValue < 1 || monthValue > 12)) {
            return `${funcName}() second argument (month) must be between 1 and 12`;
          }
        }
        
        if (!dayArg.startsWith('{')) {
          const dayValue = Number.parseFloat(dayArg);
          if (!Number.isNaN(dayValue) && (dayValue < 1 || dayValue > 31)) {
            return `${funcName}() third argument (day) must be between 1 and 31`;
          }
        }
      }
    }
  }
  
  return null;
};

// Validate math operators
const validateMathOperators = (formula: string, context: FormulaContext): string | null => {
  const { columns, allColumns } = context;
  const searchColumns = allColumns.length > 0 ? allColumns : columns;
  const validFieldNames = new Set<string>();
  searchColumns.forEach(col => {
    if (col.title) validFieldNames.add(col.title);
    if (col.name) validFieldNames.add(col.name);
    if (col.column_name) validFieldNames.add(col.column_name);
  });
  
  // Check if formula contains any math operators
  const hasMathOperator = /[+\-*/]/.test(formula);
  if (!hasMathOperator) {
    return null;
  }
  
  // Check if formula contains function calls - if so, validation is handled elsewhere
  if (containsFunctionCallToken(formula)) {
    return null;
  }
  
  // Extract all field references from the formula
  const fieldRefs = extractFieldReferences(formula);
  const uniqueFieldNames = new Set<string>();
  
  for (const ref of fieldRefs) {
    const fieldName = parseFieldReference(ref);
    if (fieldName && !isNumericLiteral(fieldName)) {
      uniqueFieldNames.add(fieldName);
    }
  }
  
  // Validate all field references are numeric
  for (const fieldName of uniqueFieldNames) {
    if (!validFieldNames.has(fieldName)) {
      return `Unknown field: ${fieldName}`;
    }
    const fieldType = getFieldType(fieldName, context);
    if (!isNumericType(fieldType)) {
      return `Math operators require numeric fields. "${fieldName}" is a ${fieldType || 'non-numeric'} field`;
    }
  }
  
  // Validate numeric literals (check for invalid numeric patterns)
  // Extract potential numeric literals (not inside quotes or field references)
  const processedFormula = removeFieldRefsAndQuoted(formula);
  const numericLiterals = collectNumericLiterals(processedFormula);
  
  for (const numStr of numericLiterals) {
    // Check if it's a valid number (not part of a function name or invalid)
    if (numStr && !isNumericLiteral(numStr.trim())) {
      // This shouldn't happen with the regex, but just in case
      continue;
    }
  }
  
  // Check for invalid operator usage (e.g., truly invalid consecutive operators)
  // Valid: {A} + {B} - {C} (operators separated by operands, + - is valid)
  // Invalid: {A} ++ {B}, {A} ** {B}, {A} */ {B}, etc.
  // Also invalid: operators at start/end without operands
  
  // Check for truly invalid consecutive operator patterns in the original formula
  // These are patterns where two operators appear next to each other with only whitespace
  // Note: + - and - + are VALID (addition then subtraction)
  let inQuotes = false;
  let quoteChar = '';
  let inFieldRef = false;
  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    const prevChar = i > 0 ? formula[i - 1] : '';

    // Track quotes
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        inQuotes = false;
        quoteChar = '';
      }
    }

    // Track field references
    if (!inQuotes) {
      if (char === '{' && prevChar !== '\\') {
        inFieldRef = true;
      } else if (char === '}' && prevChar !== '\\') {
        inFieldRef = false;
      }
    }

    if (inQuotes || inFieldRef) continue;

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      let j = i + 1;
      while (j < formula.length && isWhitespaceChar(formula[j])) j++;
      if (j < formula.length && (formula[j] === '+' || formula[j] === '-' || formula[j] === '*' || formula[j] === '/')) {
        const pair = char + formula[j];
        if (pair === '+-' || pair === '-+') continue;
        if (pair === '++' || pair === '--' || pair === '**' || pair === '//' || pair === '*/' || pair === '/*') {
          return 'Invalid operator usage: operators cannot be consecutive';
        }
      }
    }
  }
  
  // Check for operators at invalid positions (start or end without operands)
  const trimmedFormula = formula.trim();
  if (trimmedFormula && (trimmedFormula[0] === '*' || trimmedFormula[0] === '/')) {
    return 'Invalid operator usage: expression cannot start with * or /';
  }
  if (trimmedFormula) {
    const lastChar = trimmedFormula[trimmedFormula.length - 1];
    if (lastChar === '+' || lastChar === '-' || lastChar === '*' || lastChar === '/') {
      return 'Invalid operator usage: expression cannot end with an operator';
    }
  }
  
  return null;
};

// Validate comparison operators
const validateComparisonOperators = (formula: string, context: FormulaContext): string | null => {
  const { columns, allColumns } = context;
  const searchColumns = allColumns.length > 0 ? allColumns : columns;
  const validFieldNames = new Set<string>();
  searchColumns.forEach(col => {
    if (col.title) validFieldNames.add(col.title);
    if (col.name) validFieldNames.add(col.name);
    if (col.column_name) validFieldNames.add(col.column_name);
  });
  
  const operatorMatches = findOperatorMatches(
    formula,
    COMPARISON_OPERATORS.map(item => item.op)
  );

  for (const { op, index: matchIndex } of operatorMatches) {
      
      if (matchIndex > 0) {
        const charBefore = formula[matchIndex - 1];
        if (op === '=' && charBefore === '!') continue;
      }
      if (op === '>' && matchIndex < formula.length - 1 && formula[matchIndex + 1] === '=') {
        continue;
      }
      if (op === '<' && matchIndex < formula.length - 1 && formula[matchIndex + 1] === '=') {
        continue;
      }
      
      const beforeOp = formula.substring(0, matchIndex).trim();
      const afterOp = formula.substring(matchIndex + op.length).trim();
      
      let inQuotes = false;
      let quoteChar = '';
      for (let i = 0; i < matchIndex; i++) {
        const char = formula[i];
        const prevChar = i > 0 ? formula[i - 1] : '';
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
            quoteChar = '';
          }
        }
      }
      if (inQuotes) continue;
      
      let parenDepth = 0;
      for (let i = 0; i < matchIndex; i++) {
        if (formula[i] === '(' && (i === 0 || formula[i - 1] !== '\\')) parenDepth++;
        if (formula[i] === ')' && (i === 0 || formula[i - 1] !== '\\')) parenDepth--;
      }
      if (parenDepth > 0) continue;
      
      const extractLeftOperand = (input: string): string | null => {
        let i = input.length - 1;
        while (i >= 0 && isWhitespaceChar(input[i])) i--;
        if (i < 0) return null;

        const endChar = input[i];
        if (endChar === '}') {
          const start = input.lastIndexOf('{', i);
          return start >= 0 ? input.slice(start, i + 1) : null;
        }
        if (endChar === '"' || endChar === "'") {
          const quote = endChar;
          for (let j = i - 1; j >= 0; j--) {
            if (input[j] === quote && input[j - 1] !== '\\') {
              return input.slice(j, i + 1);
            }
          }
          return null;
        }
        if (endChar === ')') {
          let depth = 1;
          for (let j = i - 1; j >= 0; j--) {
            const ch = input[j];
            if (ch === ')') depth++;
            else if (ch === '(') depth--;
            if (depth === 0) {
              let k = j - 1;
              while (k >= 0 && isIdentChar(input[k])) k--;
              const nameStart = k + 1;
              if (nameStart < j && isIdentStart(input[nameStart])) {
                return input.slice(nameStart, i + 1);
              }
              return input.slice(j, i + 1);
            }
          }
          return null;
        }

        let j = i;
        while (j >= 0 && !isWhitespaceChar(input[j]) && !['=', '!', '<', '>'].includes(input[j])) j--;
        return input.slice(j + 1, i + 1);
      };

      const extractRightOperand = (input: string): string | null => {
        let i = 0;
        while (i < input.length && isWhitespaceChar(input[i])) i++;
        if (i >= input.length) return null;

        const startChar = input[i];
        if (startChar === '{') {
          const end = input.indexOf('}', i + 1);
          return end !== -1 ? input.slice(i, end + 1) : null;
        }
        if (startChar === '"' || startChar === "'") {
          const quote = startChar;
          for (let j = i + 1; j < input.length; j++) {
            if (input[j] === quote && input[j - 1] !== '\\') {
              return input.slice(i, j + 1);
            }
          }
          return null;
        }
        if (isIdentStart(startChar)) {
          let j = i + 1;
          while (j < input.length && isIdentChar(input[j])) j++;
          if (input[j] === '(') {
            let depth = 1;
            for (let k = j + 1; k < input.length; k++) {
              const ch = input[k];
              if (ch === '(') depth++;
              else if (ch === ')') depth--;
              if (depth === 0) return input.slice(i, k + 1);
            }
            return null;
          }
        }

        let j = i;
        while (j < input.length && !isWhitespaceChar(input[j]) && !['=', '!', '<', '>'].includes(input[j])) j++;
        return input.slice(i, j);
      };

      const leftSideRaw = extractLeftOperand(beforeOp);
      const rightSideRaw = extractRightOperand(afterOp);
      if (!leftSideRaw || !rightSideRaw) continue;

      let leftSide = leftSideRaw.trim();
      let rightSide = rightSideRaw.trim();
      
      if (['>', '<', '=', '!'].includes(leftSide)) continue;
      if (['>', '<', '=', '!'].includes(rightSide)) continue;
      
      if (leftSide.startsWith('{') && leftSide.endsWith('}')) {
        const fieldName = parseFieldReference(leftSide);
        if (!/^-?(?:\d+\.?\d*|\d*\.\d+)$/.test(fieldName)) {
          if (!validFieldNames.has(fieldName)) {
            return `Unknown field in comparison: "${fieldName}"`;
          }
        }
      } else if (!/^-?(?:\d+\.?\d*|\d*\.\d+)$/.test(leftSide) && 
                 !(leftSide.startsWith('"') && leftSide.endsWith('"')) &&
                 !(leftSide.startsWith("'") && leftSide.endsWith("'"))) {
        if (!/^[A-Z_]+\(/.test(leftSide)) {
          return `Invalid left side in comparison: "${leftSide}"`;
        }
      }
      
      if (rightSide.startsWith('{') && rightSide.endsWith('}')) {
        const fieldName = parseFieldReference(rightSide);
        if (!isNumericLiteral(fieldName)) {
          if (!validFieldNames.has(fieldName)) {
            return `Unknown field in comparison: "${fieldName}"`;
          }
        }
      } else if (!isNumericLiteral(rightSide) && 
                 !(rightSide.startsWith('"') && rightSide.endsWith('"')) &&
                 !(rightSide.startsWith("'") && rightSide.endsWith("'"))) {
        if (!startsWithFunctionCall(rightSide)) {
          return `Invalid right side in comparison: "${rightSide}"`;
        }
      }
  }
  
  return null;
};

// Validate logical functions
const validateLogicalFunctions = (formula: string, _context: FormulaContext): string | null => {
  for (const funcName of LOGICAL_FUNCTION_NAMES) {
    const funcRegex = new RegExp(String.raw`\b${funcName}\s*\(([^)]*)\)`, 'gi');
    const matches = [...formula.matchAll(funcRegex)];
    
    for (const match of matches) {
      const argsString = match[1] || '';
      const args = parseFunctionArguments(argsString);
      
      if (funcName === 'IF') {
        if (args.length < 2) {
          return `${funcName}() requires at least 2 arguments: ${funcName}(condition, value_if_true, value_if_false)`;
        }
        if (args.length > 3) {
          return `${funcName}() accepts at most 3 arguments, but ${args.length} provided`;
        }
        
        const conditionArg = args[0].trim();
        const hasOperator = /[=!<>]/.test(conditionArg);
        const isFieldRef = conditionArg.startsWith('{') && conditionArg.endsWith('}');
        const isBooleanLiteral = /^(true|false)$/i.test(conditionArg);
        
        if (!hasOperator && !isFieldRef && !isBooleanLiteral) {
          if (!/^[A-Z_]+\(/.test(conditionArg)) {
            return `${funcName}() first argument must be a condition (comparison, field reference, or boolean)`;
          }
        }
      } else if (['AND', 'OR'].includes(funcName)) {
        if (args.length < 1) {
          return `${funcName}() requires at least 1 argument`;
        }
        
        for (let i = 0; i < args.length; i++) {
          const conditionArg = args[i].trim();
          const hasOperator = /[=!<>]/.test(conditionArg);
          const isFieldRef = conditionArg.startsWith('{') && conditionArg.endsWith('}');
          const isBooleanLiteral = /^(true|false)$/i.test(conditionArg);
          
          if (!hasOperator && !isFieldRef && !isBooleanLiteral) {
            if (!/^[A-Z_]+\(/.test(conditionArg)) {
              return `${funcName}() argument ${i + 1} must be a condition (comparison, field reference, or boolean)`;
            }
          }
        }
      } else if (funcName === 'NOT') {
        if (args.length < 1) {
          return `${funcName}() requires 1 argument: ${funcName}(condition)`;
        }
        if (args.length > 1) {
          return `${funcName}() accepts only 1 argument, but ${args.length} provided`;
        }
        
        const conditionArg = args[0].trim();
        const hasOperator = /[=!<>]/.test(conditionArg);
        const isFieldRef = conditionArg.startsWith('{') && conditionArg.endsWith('}');
        const isBooleanLiteral = /^(true|false)$/i.test(conditionArg);
        
        if (!hasOperator && !isFieldRef && !isBooleanLiteral) {
          if (!/^[A-Z_]+\(/.test(conditionArg)) {
            return `${funcName}() argument must be a condition (comparison, field reference, or boolean)`;
          }
        }
      } else if (['ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISDATE'].includes(funcName)) {
        if (args.length < 1) {
          return `${funcName}() requires 1 argument: ${funcName}({Field})`;
        }
        if (args.length > 1) {
          return `${funcName}() accepts only 1 argument, but ${args.length} provided`;
        }
        
        const arg = args[0].trim();
        const isFieldRef = arg.startsWith('{') && arg.endsWith('}');
        const isQuoted = (arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"));
        const isNumber = /^-?(?:\d+\.?\d*|\d*\.\d+)$/.test(arg);
        const isFunction = /^[A-Z_]+\(/.test(arg);
        
        if (!isFieldRef && !isQuoted && !isNumber && !isFunction) {
          return `${funcName}() argument must be a field reference, quoted string, number, or function call`;
        }
      }
    }
  }
  
  return null;
};

// Main validation orchestrator
export const validateFormula = (formula: string, context: FormulaContext): string | null => {
  if (!formula.trim()) return null;
  
  // Run all validation functions in order
  let error = validateBasicSyntax(formula);
  if (error) return error;
  
  error = validateCompoundStatements(formula);
  if (error) return error;
  
  error = validateFieldReferences(formula, context);
  if (error) return error;
  
  error = validateMathFunctions(formula, context);
  if (error) return error;
  
  error = validateTextFunctions(formula, context);
  if (error) return error;
  
  error = validateDateFunctions(formula, context);
  if (error) return error;
  
  error = validateMathOperators(formula, context);
  if (error) return error;
  
  error = validateComparisonOperators(formula, context);
  if (error) return error;
  
  error = validateLogicalFunctions(formula, context);
  if (error) return error;
  
  return null;
};

// Utility function to normalize values for comparison
// This prevents unnecessary onChange calls by properly comparing values
export const normalizeForComparison = (val: any): any => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val;
  // For strings, try to parse as number if it looks like one
  if (typeof val === 'string') {
    const numVal = Number.parseFloat(val);
    if (!Number.isNaN(numVal) && Number.isFinite(numVal) && val.trim() === numVal.toString()) {
      return numVal;
    }
  }
  return String(val);
};

// Convert formula result to value for onChange
// Handles different result types (number, boolean, Date, string)
export const convertResultToValue = (
  result: any,
  formattingType: string
): any => {
  if (typeof result === 'number') {
    return result;
  }
  if (typeof result === 'boolean') {
    return result;
  }
  if (result instanceof Date) {
    // Use date-only format for date type, full datetime for datetime type
    if (formattingType === 'date') {
      return result.toISOString().split('T')[0];
    }
    return result.toISOString();
  }
  return String(result);
};

