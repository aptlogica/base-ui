export interface FormulaFormatting {
  type: 'number' | 'currency' | 'percent' | 'duration' | 'date' | 'text';
  precision: number;
  currency: string;
  dateFormat: string;
}

export interface BuildFieldMetaParams {
  selectedTypeKey: string;
  defaultValue: any;
  richText: boolean;
  showThousands: boolean;
  precision: string | number;
  checkboxIcon: string;
  checkboxColor: string;
  checkboxDefault: boolean;
  selectOptions: Array<{ option: string; color: string }>;
  singleDefault: string;
  multiDefault: string[];
  ratingIcon: string;
  ratingColor: string;
  ratingMax: number;
  ratingDefault: number;
  description: string;
  dateFormat: string;
  timeFormat: string;
  hourFormat: '12' | '24';
  displayTimeZone: boolean;
  sameTimezone: boolean;
  timeZone: string;
  timeZoneOptions: Array<{ label: string; value: string }>;
  dateTimeDefault: string;
  currencyType: string;
  currencyLocale: string;
  displayAsProgress: boolean;
  progressColor: string;
  percentDefault: number | null;
  durationFormat: string;
  durationDefault: number;
  yearDefault: number | null;
  dateDefault: string;
  timeDefault: string;
  phoneValid: boolean;
  phoneDefault: string;
  emailValid: boolean;
  emailDefault: string;
  urlValid: boolean;
  urlDefault: string;
  allowMultipleUsers: boolean;
  selectedUsers: string | string[] | null;
  selectedTableId: string;
  selectedTable: any;
  relationType: 'one-to-one' | 'has-many' | 'many-to-many';
  selectedRelationId: string;
  selectedLookupColumnId: string;
  linkFields: any[];
  buttonStyle: string;
  buttonAction: string;
  openButtonInNewTab: boolean;
  formulaText: string;
  formulaFormatting: FormulaFormatting;
  getBrowserTimeZone: () => string;
}

export interface BuildFieldMetaResult {
  meta?: any;
  error?: string;
}

export interface BuildColumnPayloadParams {
  fieldName: string;
  selectedTypeKey: string;
  description: string;
  fields: any[];
  initialValues?: any;
  meta: any;
}

export const isDuplicateFieldName = (params: {
  fieldName: string;
  fields: any[];
  currentId?: string;
}) => {
  const trimmed = params.fieldName.trim().toLowerCase();
  return params.fields.some(f =>
    (f.name || f.title || f.key || '').toLowerCase() === trimmed &&
    (params.currentId ? (f.id || f.key) !== params.currentId : true)
  );
};

export const toTitleCase = (str: string) =>
  str.replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

export const getUniqueColumnNameByUidt = (uidt: string, fields: any[]) => {
  // Map certain uidt values to more user-friendly display names
  const uidtDisplayMap: Record<string, string> = {
    'boolean': 'Checkbox',
    'longText': 'Long Text',
    'phoneNumber': 'Phone Number',
    'multiSelect': 'Multi Select',
    'datetime': 'DateTime',
    // Add more mappings as needed
  };

  const displayName = uidtDisplayMap[uidt] || uidt;
  const baseName = toTitleCase(displayName);
  const existingNames = fields.map(f => (f.name || f.title || f.key || '').toLowerCase());
  let name = baseName;
  let counter = 1;
  while (existingNames.includes(name.toLowerCase())) {
    const match = name.match(/^(.*?)(\s(\d+))?$/);
    if (match) {
      const prefix = match[1];
      const num = match[3] ? parseInt(match[3], 10) : 0;
      counter = num + 1;
      name = `${prefix} ${counter}`;
    } else {
      name = `${baseName} ${counter}`;
    }
  }
  return name;
};

const applyDateTimeConfig = (
  config: any,
  params: Pick<
    BuildFieldMetaParams,
    | 'dateFormat'
    | 'timeFormat'
    | 'hourFormat'
    | 'displayTimeZone'
    | 'sameTimezone'
    | 'timeZone'
    | 'timeZoneOptions'
    | 'getBrowserTimeZone'
  >
) => {
  config.dateFormat = params.dateFormat;
  config.timeFormat = params.timeFormat;
  config.hourFormat = params.hourFormat;
  config.displayTimeZone = params.displayTimeZone;
  config.sameTimezone = params.sameTimezone;

  if (params.sameTimezone && params.timeZone) {
    const selectedCode = params.timeZoneOptions.find(o => o.label === params.timeZone)?.value || '';
    config.timeZone = selectedCode;
    config.timeZoneLabel = params.timeZone;
    return;
  }

  if (params.displayTimeZone && !params.sameTimezone) {
    const browserLabel = params.getBrowserTimeZone();
    const browserCode = params.timeZoneOptions.find(o => o.label === browserLabel)?.value || '';
    if (browserCode) {
      config.timeZone = browserCode;
      config.timeZoneLabel = browserLabel;
    }
  }
};

export const buildFieldMeta = (params: BuildFieldMetaParams): BuildFieldMetaResult => {
  const config: any = {};

  if (params.defaultValue && (typeof params.defaultValue === 'string' ? params.defaultValue.trim() : true)) {
    switch (params.selectedTypeKey) {
      case 'number':
      case 'decimal':
      case 'currency':
      case 'percent': {
        const parsed = typeof params.defaultValue === 'string'
          ? parseFloat(params.defaultValue)
          : params.defaultValue;
        config.defaultValue = isNaN(parsed) ? params.defaultValue : parsed;
        break;
      }
      case 'boolean':
        config.defaultValue = params.defaultValue === 'true' || params.defaultValue === '1';
        break;
      case 'rating':
        config.defaultValue = parseInt(params.defaultValue, 10) || 0;
        break;
      case 'year':
        config.defaultValue = typeof params.defaultValue === 'string'
          ? (parseInt(params.defaultValue, 10) || params.defaultValue)
          : params.defaultValue;
        break;
      case 'json':
        if (typeof params.defaultValue === 'object') {
          config.defaultValue = params.defaultValue;
        } else {
          try {
            config.defaultValue = JSON.parse(params.defaultValue);
          } catch {
            config.defaultValue = params.defaultValue;
          }
        }
        break;
      default:
        config.defaultValue = params.defaultValue;
    }
  }

  if (params.selectedTypeKey === 'longText') {
    config.richText = params.richText;
  }
  if (params.selectedTypeKey === 'number') {
    config.showThousands = params.showThousands;
  }
  if (params.selectedTypeKey === 'decimal') {
    config.precision = params.precision;
    config.showThousands = params.showThousands;
  }
  if (params.selectedTypeKey === 'boolean') {
    config.icon = params.checkboxIcon;
    config.color = params.checkboxColor;
    config.defaultValue = params.checkboxDefault;
  }
  if (params.selectedTypeKey === 'select') {
    config.options = params.selectOptions;
    if (params.singleDefault?.trim()) {
      config.defaultValue = params.singleDefault;
    }
  }
  if (params.selectedTypeKey === 'multiSelect') {
    config.options = params.selectOptions;
    if (params.multiDefault && params.multiDefault.length > 0) {
      config.defaultValue = params.multiDefault;
    }
  }
  if (params.selectedTypeKey === 'rating') {
    config.ratingIcon = params.ratingIcon;
    config.ratingColor = params.ratingColor;
    config.ratingMax = params.ratingMax;
    config.ratingDefault = params.ratingDefault;
    config.ratingDescription = params.description;
  }
  if (params.selectedTypeKey === 'datetime') {
    applyDateTimeConfig(config, params);
    if (params.dateTimeDefault?.trim()) {
      let formattedDateTime = params.dateTimeDefault;
      if (!formattedDateTime.includes('T')) {
        const today = new Date().toISOString().split('T')[0];
        formattedDateTime = `${today}T${formattedDateTime}`;
      }
      config.defaultValue = formattedDateTime;
    }
  }
  if (params.selectedTypeKey === 'createdTime') {
    applyDateTimeConfig(config, params);
  }
  if (params.selectedTypeKey === 'lastModifiedTime') {
    applyDateTimeConfig(config, params);
  }
  if (params.selectedTypeKey === 'currency') {
    config.currencyType = params.currencyType;
    config.currencyLocale = params.currencyLocale;
    config.precision = params.precision;
    if (params.currencyDefault) {
      config.defaultValue = params.currencyDefault;
    }
  }
  if (params.selectedTypeKey === 'percent') {
    config.displayAsProgress = params.displayAsProgress;
    config.progressColor = params.progressColor;
    if (params.percentDefault !== null) {
      config.defaultValue = params.percentDefault;
    }
  }
  if (params.selectedTypeKey === 'duration') {
    config.durationFormat = params.durationFormat;
    if (params.durationDefault) {
      config.defaultValue = params.durationDefault;
    }
  }
  if (params.selectedTypeKey === 'year') {
    if (params.yearDefault !== null) {
      config.defaultValue = params.yearDefault;
    }
  }
  if (params.selectedTypeKey === 'date') {
    config.dateFormat = params.dateFormat;
    if (params.dateDefault?.trim()) {
      config.defaultValue = params.dateDefault;
    }
  }
  if (params.selectedTypeKey === 'time') {
    config.hourFormat = params.hourFormat;
    config.timeFormat = params.timeFormat;
    if (params.timeDefault?.trim()) {
      let formattedTime = params.timeDefault;
      if (params.hourFormat === '12' && params.timeDefault.includes(' ')) {
        const [time, period] = params.timeDefault.split(' ');
        const [hours, minutes] = time.split(':');
        let hour = parseInt(hours, 10);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        formattedTime = `${hour.toString().padStart(2, '0')}:${minutes}`;
      }
      config.defaultValue = formattedTime;
    }
  }
  if (params.selectedTypeKey === 'text') {
    if (params.defaultValue && (typeof params.defaultValue === 'string' ? params.defaultValue.trim() : true)) {
      config.defaultValue = params.defaultValue;
    }
  }
  if (params.selectedTypeKey === 'phoneNumber') {
    config.phoneValid = params.phoneValid;
    if (params.phoneDefault?.trim()) {
      config.defaultValue = params.phoneDefault;
    }
  }
  if (params.selectedTypeKey === 'email') {
    config.emailValid = params.emailValid;
    if (params.emailDefault?.trim()) {
      config.defaultValue = params.emailDefault;
    }
  }
  if (params.selectedTypeKey === 'url') {
    config.urlValid = params.urlValid;
    if (params.urlDefault?.trim()) {
      config.defaultValue = params.urlDefault;
    }
  }
  if (params.selectedTypeKey === 'user') {
    config.allowMultiple = params.allowMultipleUsers;
    if (params.selectedUsers) {
      config.defaultValue = params.selectedUsers;
    }
  }
  if (params.selectedTypeKey === 'links') {
    if (!params.selectedTableId || !params.selectedTable) {
      return { error: 'Target table is required for relation fields' };
    }
    config.relation = {
      with: params.selectedTableId,
      type: params.relationType
    };
  }
  if (params.selectedTypeKey === 'lookup') {
    if (!params.selectedRelationId) {
      return { error: 'Please select a Link Field' };
    }
    if (!params.selectedLookupColumnId) {
      return { error: 'Please select a Lookup Field' };
    }
    const selectedLinkField = params.linkFields.find(f => f.id === params.selectedRelationId);
    const relationIdFromMeta =
      selectedLinkField?.meta?.relation_id ||
      selectedLinkField?.config?.relation_id ||
      selectedLinkField?.meta?.relation?.id ||
      selectedLinkField?.config?.relation?.id ||
      selectedLinkField?.relation_id;
    if (!relationIdFromMeta) {
      return { error: 'Selected link field does not have a valid relation_id' };
    }
    config.relation_id = relationIdFromMeta;
    config.lookup_column_id = params.selectedLookupColumnId;
  }
  if (params.selectedTypeKey === 'button') {
    if (params.defaultValue && (typeof params.defaultValue === 'string' ? params.defaultValue.trim() : true)) {
      config.buttonText = String(params.defaultValue);
    }
    config.buttonStyle = params.buttonStyle;
    config.action = params.buttonAction;
    config.openInNewTab = params.openButtonInNewTab;
  }
  if (params.selectedTypeKey === 'json') {
    if (params.defaultValue && (typeof params.defaultValue === 'string' ? params.defaultValue.trim() : true)) {
      config.defaultValue = params.defaultValue;
    }
  }
  if (params.selectedTypeKey === 'formula') {
    config.formula = params.formulaText;
    config.formatting = {
      type: params.formulaFormatting.type,
      precision: params.formulaFormatting.precision,
      currency: params.formulaFormatting.currency,
      dateFormat: params.formulaFormatting.dateFormat
    };
  }

  return { meta: config };
};

export const buildColumnPayload = (params: BuildColumnPayloadParams) => {
  const uidtBase = params.selectedTypeKey || 'Field';
  const uniqueColName = getUniqueColumnNameByUidt(uidtBase, params.fields);

  let finalMeta = params.meta;
  if (params.selectedTypeKey === 'links' && params.initialValues) {
    finalMeta = params.initialValues.meta || params.initialValues.config || {};
  }

  return {
    key: params.fieldName || uniqueColName,
    title: params.fieldName || uniqueColName,
    name: params.fieldName || uniqueColName,
    type: params.selectedTypeKey,
    description: params.description,
    meta: finalMeta,
  };
};
