// Shared field type normalization for both Grid and Form plugins
// Maps various uidt/legacy aliases to the canonical FieldRenderer types
export type FieldRendererType =
  | 'number' | 'boolean' | 'multiSelect' | 'select' | 'longText' | 'attachment' | 'text' | 'decimal' | 'year' | 'time' | 'datetime' | 'currency' | 'percent' | 'duration' | 'date' | 'email' | 'phoneNumber' | 'url' | 'rating' | 'user' | 'button' | 'json' | 'links' | 'createdTime' | 'lastModifiedTime' | 'createdBy' | 'lastModifiedBy' | 'formula' | 'lookup';

export const normalizeFieldType = (type: string): FieldRendererType => {
  const t = (type || '').toString();
  switch (t.toLowerCase()) {
    case 'text': return 'text';
    case 'number': return 'number';
    case 'decimal': return 'decimal';
    case 'year': return 'year';
    case 'time': return 'time';
    case 'datetime': return 'datetime';
    case 'date': return 'date';
    case 'email': return 'email';
    case 'phonenumber': return 'phoneNumber';
    case 'url': return 'url';
    case 'singleselect': return 'select';
    case 'multiselect': return 'multiSelect';
    case 'boolean':
    case 'checkbox': return 'boolean';
    case 'rating': return 'rating';
    case 'currency': return 'currency';
    case 'percent': return 'percent';
    case 'duration': return 'duration';
    case 'json': return 'json';
    case 'attachment':
    case 'file': return 'attachment';
    case 'user': return 'user';
    case 'button': return 'button';
    case 'createdtime': return 'createdTime';
    case 'lastmodifiedtime': return 'lastModifiedTime';
    case 'createdby': return 'createdBy';
    case 'lastmodifiedby': return 'lastModifiedBy';
    case 'uuid': return 'text';
    case 'links': return 'links';
    case 'lookup': return 'lookup';
    case 'formula': return 'formula';
    case 'longtext':
    case 'long_text':
    case 'textarea': return 'longText';
  }
  switch (t) {
    case 'text': return 'text';
    case 'number': return 'number';
    case 'decimal': return 'decimal';
    case 'year': return 'year';
    case 'time': return 'time';
    case 'datetime': return 'datetime';
    case 'date': return 'date';
    case 'email': return 'email';
    case 'phoneNumber': return 'phoneNumber';
    case 'url': return 'url';
    case 'singleSelect':
    case 'select': return 'select';
    case 'multiSelect': return 'multiSelect';
    case 'boolean':
    case 'checkbox': return 'boolean';
    case 'rating': return 'rating';
    case 'currency': return 'currency';
    case 'percent': return 'percent';
    case 'duration': return 'duration';
    case 'json': return 'json';
    case 'attachment':
    case 'file': return 'attachment';
    case 'user': return 'user';
    case 'button': return 'button';
    case 'createdTime': return 'createdTime';
    case 'lastModifiedTime': return 'lastModifiedTime';
    case 'createdBy': return 'createdBy';
    case 'lastModifiedBy': return 'lastModifiedBy';
    case 'dropdown': return 'multiSelect';
    case 'radio': return 'select';
    case 'textarea': return 'longText';
    case 'SingleLineText': return 'text';
    case 'LongText': return 'longText';
    case 'Number': return 'number';
    case 'Decimal': return 'decimal';
    case 'DateTime': return 'datetime';
    case 'Date': return 'date';
    case 'Email': return 'email';
    case 'PhoneNumber': return 'phoneNumber';
    case 'URL': return 'url';
    case 'SingleSelect': return 'select';
    case 'MultiSelect': return 'multiSelect';
    case 'Checkbox': return 'boolean';
    case 'Rating': return 'rating';
    case 'Currency': return 'currency';
    case 'Percent': return 'percent';
    case 'Duration': return 'duration';
    case 'Year': return 'year';
    case 'Time': return 'time';
    case 'JSON': return 'json';
    case 'Attachment': return 'attachment';
    case 'Button': return 'button';
    case 'User': return 'user';
    case 'CreatedTime': return 'createdTime';
    case 'LastModifiedTime': return 'lastModifiedTime';
    case 'CreatedBy': return 'createdBy';
    case 'LastModifiedBy': return 'lastModifiedBy';
    case 'Formula': return 'formula';
    default: return 'text';
  }
};
