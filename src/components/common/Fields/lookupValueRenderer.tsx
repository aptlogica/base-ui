// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React from 'react';
import {
  renderRatingPill,
  renderLongTextPill,
  renderDateTimePill,
  renderEmailPill,
  renderUserPill,
  renderDurationPill,
  renderCheckboxPill,
  renderCurrencyPill,
  renderPercentPill,
  renderDecimalPill,
  renderURLPill,
  renderPhoneNumberPill,
  renderYearPill,
  renderNumberPill,
  renderJSONPill,
  renderMultiSelectPill,
  renderSingleSelectPill,
  renderTextPill,
} from './lookupRenderers';
import { getFieldTypeFromSource } from './lookupUtils';

export const renderLookupValue = (
  value: any,
  sourceColumn: any,
  index: number
): React.ReactNode | null => {
  if (value === null || value === undefined) return null;

  const fieldType = getFieldTypeFromSource(sourceColumn);
  const renderProps = { value, sourceColumn, index };

  switch (fieldType) {
    case 'rating':
      return renderRatingPill(renderProps);
    case 'longText':
      return renderLongTextPill(renderProps);
    case 'datetime':
    case 'date':
      return renderDateTimePill(renderProps);
    case 'email':
      return renderEmailPill(renderProps);
    case 'user':
    case 'createdBy':
    case 'lastModifiedBy':
      return renderUserPill(renderProps);
    case 'duration':
      return renderDurationPill(renderProps);
    case 'boolean':
    case 'checkbox':
      return renderCheckboxPill(renderProps);
    case 'currency':
      return renderCurrencyPill(renderProps);
    case 'percent':
      return renderPercentPill(renderProps);
    case 'decimal':
      return renderDecimalPill(renderProps);
    case 'url':
      return renderURLPill(renderProps);
    case 'phoneNumber':
      return renderPhoneNumberPill(renderProps);
    case 'year':
      return renderYearPill(renderProps);
    case 'number':
      return renderNumberPill(renderProps);
    case 'json':
      return renderJSONPill(renderProps);
    case 'multiSelect':
      return renderMultiSelectPill(renderProps);
    case 'select':
      return renderSingleSelectPill(renderProps);
    default:
      return renderTextPill(renderProps);
  }
};
