// Comprehensive formula functions like NocoDB
export const FORMULA_FUNCTIONS = {
  'Math Functions': [
    { name: 'ADD()', description: 'Computes the total of multiple numbers provided as arguments.', example: 'ADD({Price}, {Tax})' },
    { name: 'SUBTRACT()', description: 'Subtracts one number from another.', example: 'SUBTRACT({Total}, {Discount})' },
    { name: 'MULTIPLY()', description: 'Multiplies multiple numbers.', example: 'MULTIPLY({Price}, {Quantity})' },
    { name: 'DIVIDE()', description: 'Divides one number by another.', example: 'DIVIDE({Total}, {Count})' },
    { name: 'SUM()', description: 'Sums multiple values together.', example: 'SUM({Price1}, {Price2})' },
    { name: 'AVERAGE()', description: 'Calculates the mean (average) of numeric values.', example: 'AVERAGE({Score1}, {Score2})' },
    { name: 'MAX()', description: 'Finds the highest numeric value among the inputs.', example: 'MAX({Value1}, {Value2})' },
    { name: 'MIN()', description: 'Finds the lowest numeric value among the inputs.', example: 'MIN({Value1}, {Value2})' },
    { name: 'ROUND()', description: 'Rounds a number to a specified decimal precision (default 0).', example: 'ROUND({Price}, 2)' },
    { name: 'CEILING()', description: 'Rounds a number up to the nearest integer greater than or equal to it.', example: 'CEILING({Price})' },
    { name: 'FLOOR()', description: 'Rounds a number down to the nearest integer less than or equal to it.', example: 'FLOOR({Price})' },
    { name: 'ABS()', description: 'Returns the absolute (non-negative) value of a number.', example: 'ABS({Number})' },
    { name: 'POWER()', description: 'Raises a number to the power of an exponent.', example: 'POWER({Number}, 2)' },
    { name: 'SQRT()', description: 'Calculates the square root of a number.', example: 'SQRT({Number})' },
    { name: 'MOD()', description: 'Returns the remainder after dividing one number by another.', example: 'MOD({Number}, 2)' }
  ],
  'Text Functions': [
    { name: 'CONCAT()', description: 'Concatenates one or more strings into a single string.', example: 'CONCAT({FirstName}, " ", {LastName})' },
    { name: 'LEN()', description: 'Calculates the total number of characters in a string.', example: 'LEN({Text})' },
    { name: 'LOWER()', description: 'Transforms all characters in a string to lowercase.', example: 'LOWER({Name})' },
    { name: 'TRIM()', description: 'Removes leading and trailing whitespace from a string.', example: 'TRIM({Text})' },
    { name: 'LEFT()', description: 'Retrieves the first n characters from the beginning of a string.', example: 'LEFT({Text}, 5)' },
    { name: 'RIGHT()', description: 'Retrieves the last n characters from the end of a string.', example: 'RIGHT({Text}, 5)' },
    { name: 'MID()', description: 'Retrieves a substring starting at a specified position for a given length.', example: 'MID({Text}, 2, 5)' },
    { name: 'REPLACE()', description: 'Substitutes all instances of a substring with another substring.', example: 'REPLACE({Text}, "old", "new")' }
  ],
  'Date Functions': [
    { name: 'TODAY()', description: 'Returns the current date.', example: 'TODAY()' },
    { name: 'NOW()', description: 'Returns the current date and time.', example: 'NOW()' },
    { name: 'YEAR()', description: 'Returns the year from a date as an integer.', example: 'YEAR({Date})' },
    { name: 'MONTH()', description: 'Returns the month (1-12) from a date.', example: 'MONTH({Date})' },
    { name: 'DAY()', description: 'Returns the day of the month (1-31) from a date.', example: 'DAY({Date})' },
    { name: 'WEEKDAY()', description: 'Returns the day of the week as an integer (0-6).', example: 'WEEKDAY({Date})' },
    { name: 'DATEADD()', description: 'Adds a specified amount of time to a date.', example: 'DATEADD({Date}, 1, "day")' },
    { name: 'DATEDIFF()', description: 'Calculates the difference between two dates in specified units.', example: 'DATEDIFF({Date1}, {Date2}, "days")' },
    { name: 'DATE()', description: 'Creates a date from year, month, and day components.', example: 'DATE(2024, 1, 15)' }
  ],
  'Logical Functions': [
    { name: 'IF()', description: 'Performs conditional logic, returns value if true, else another.', example: 'IF({Status} = "Active", "Yes", "No")' },
    { name: 'AND()', description: 'Returns TRUE if all conditions are true.', example: 'AND({A} > 0, {B} < 10)' },
    { name: 'OR()', description: 'Returns TRUE if any condition is true.', example: 'OR({A} = 1, {B} = 2)' },
    { name: 'NOT()', description: 'Returns the negation of a boolean value.', example: 'NOT({BooleanField})' },
    { name: 'ISBLANK()', description: 'Checks if a field is empty or null.', example: 'ISBLANK({Field})' },
    { name: 'ISNUMBER()', description: 'Checks if a field contains a numeric value.', example: 'ISNUMBER({Field})' },
    { name: 'ISTEXT()', description: 'Checks if a field contains text.', example: 'ISTEXT({Field})' },
    { name: 'ISDATE()', description: 'Checks if a field contains a date.', example: 'ISDATE({Field})' }
  ],
  'Comparison Operators': [
    { name: '==', description: 'Equals comparison.', example: '{A} == {B}' },
    { name: '!=', description: 'Not equals comparison.', example: '{A} != {B}' },
    { name: '>', description: 'Greater than comparison.', example: '{A} > {B}' },
    { name: '<', description: 'Less than comparison.', example: '{A} < {B}' },
    { name: '>=', description: 'Greater than or equal to comparison.', example: '{A} >= {B}' },
    { name: '<=', description: 'Less than or equal to comparison.', example: '{A} <= {B}' }
  ],
};

// Currency symbols mapping
export const CURRENCY_SYMBOLS: Record<string, string> = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CAD': 'C$',
  'AUD': 'A$',
  'CHF': 'CHF',
  'CNY': '¥',
  'INR': '₹',
  'BRL': 'R$'
};

// Function syntax mapping
export const FUNCTION_SYNTAX_MAP: Record<string, string> = {
  'ADD': 'ADD(number1, number2, ...)',
  'SUBTRACT': 'SUBTRACT(number1, number2)',
  'MULTIPLY': 'MULTIPLY(number1, number2, ...)',
  'DIVIDE': 'DIVIDE(number1, number2)',
  'SUM': 'SUM(number1, number2, ...)',
  'AVERAGE': 'AVERAGE(number1, number2, ...)',
  'MAX': 'MAX(number1, number2, ...)',
  'MIN': 'MIN(number1, number2, ...)',
  'ROUND': 'ROUND(number, decimals)',
  'CEILING': 'CEILING(number)',
  'FLOOR': 'FLOOR(number)',
  'ABS': 'ABS(number)',
  'POWER': 'POWER(number, exponent)',
  'SQRT': 'SQRT(number)',
  'MOD': 'MOD(number, divisor)',
  'CONCATENATE': 'CONCATENATE(text1, text2, ...)',
  'CONCAT': 'CONCAT(text1, text2, ...)',
  'LEN': 'LEN(text)',
  'UPPER': 'UPPER(text)',
  'LOWER': 'LOWER(text)',
  'TRIM': 'TRIM(text)',
  'LEFT': 'LEFT(text, count)',
  'RIGHT': 'RIGHT(text, count)',
  'MID': 'MID(text, start, length)',
  'FIND': 'FIND(search_text, text)',
  'REPLACE': 'REPLACE(text, old_text, new_text)',
  'TODAY': 'TODAY()',
  'NOW': 'NOW()',
  'YEAR': 'YEAR(date)',
  'MONTH': 'MONTH(date)',
  'DAY': 'DAY(date)',
  'WEEKDAY': 'WEEKDAY(date)',
  'DATEADD': 'DATEADD(date, number, unit)',
  'DATEDIFF': 'DATEDIFF(date1, date2, unit)',
  'DATE': 'DATE(year, month, day)',
  'TIME': 'TIME(hour, minute, second)',
  'IF': 'IF(condition, value_if_true, value_if_false)',
  'AND': 'AND(condition1, condition2, ...)',
  'OR': 'OR(condition1, condition2, ...)',
  'NOT': 'NOT(condition)',
  'ISBLANK': 'ISBLANK(value)',
  'ISNUMBER': 'ISNUMBER(value)',
  'ISTEXT': 'ISTEXT(value)',
  'ISDATE': 'ISDATE(value)',
};

// Valid date/time units for DATEADD and DATEDIFF
export const VALID_DATE_UNITS = [
  'year', 'years', 'month', 'months', 'day', 'days', 
  'week', 'weeks', 'hour', 'hours', 'minute', 'minutes', 
  'second', 'seconds'
];

// Math function names
export const MATH_FUNCTION_NAMES = [
  'SUBTRACT', 'MULTIPLY', 'DIVIDE', 'AVERAGE', 'CEILING', 'ADD', 'SUM', 
  'MAX', 'MIN', 'ROUND', 'FLOOR', 'POWER', 'SQRT', 'MOD', 'ABS'
];

// Text function names
export const TEXT_FUNCTION_NAMES = [
  'CONCATENATE', 'CONCAT', 'LEN', 'UPPER', 'LOWER', 'TRIM', 
  'LEFT', 'RIGHT', 'MID', 'FIND', 'REPLACE'
];

// Date function names
export const DATE_FUNCTION_NAMES = [
  'TODAY', 'NOW', 'DATEADD', 'DATEDIFF', 'WEEKDAY', 
  'YEAR', 'MONTH', 'DAY', 'DATE'
];

// Logical function names
export const LOGICAL_FUNCTION_NAMES = [
  'ISBLANK', 'ISNUMBER', 'ISTEXT', 'ISDATE', 'AND', 'OR', 'NOT', 'IF'
];

// All function names
export const ALL_FUNCTION_NAMES = [
  ...MATH_FUNCTION_NAMES,
  ...TEXT_FUNCTION_NAMES,
  ...DATE_FUNCTION_NAMES,
  ...LOGICAL_FUNCTION_NAMES
];

// Frequently used function names for quick access
export const FREQUENTLY_USED_FUNCTION_NAMES = [
  'ADD', 'SUBTRACT', 'MULTIPLY', 'DIVIDE', 'SUM', 'AVERAGE', 'MOD', 
  'CONCAT', 'DATE', 'TODAY', 'NOW', 'DATEADD'
];

// Math operators
export const MATH_OPERATORS = ['+', '-', '*', '/', '^', '%'];

// Comparison operators
export const COMPARISON_OPERATORS = [
  { op: '>=', regex: />=/g },
  { op: '<=', regex: /<=/g },
  { op: '!=', regex: /!=/g },
  { op: '==', regex: /==/g },
  { op: '>', regex: />/g },
  { op: '<', regex: /</g }
];

// Numeric field types
export const NUMERIC_TYPES = [
  'number',
  'decimal',
  'currency',
  'percent',
  'duration',
  'rating',
  'year'
];

// Text field types
export const TEXT_TYPES = [
  'text',
  'string',
  'singlelinetext',
  'multilinetext',
  'longtext',
  'email',
  'url',
  'phone',
  'link',
  'attachment',
  'formula'
];

// Date field types
export const DATE_TYPES = [
  'date',
  'datetime',
  'timestamp',
  'time'
];

// Boolean field types
export const BOOLEAN_TYPES = [
  'boolean',
  'checkbox'
];

