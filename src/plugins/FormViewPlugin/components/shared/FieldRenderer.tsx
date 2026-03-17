// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { Suspense } from 'react';

export interface FieldRendererProps {
  type: string;
  [key: string]: any; // Allow any additional props
}

const typeComponentMap: Record<
  string,
  React.LazyExoticComponent<React.ComponentType<any>>
> = {
  text: React.lazy(() =>
    import('../../../../components/common/Fields/SingleLineText').then(m => ({
      default: m.SingleLineText,
    }))
  ),
  uuid: React.lazy(() =>
    import('../../../../components/common/Fields/SingleLineText').then(m => ({
      default: m.SingleLineText,
    }))
  ),
  number: React.lazy(() =>
    import('../../../../components/common/Fields/NumberField').then(m => ({
      default: m.NumberField,
    }))
  ),
  decimal: React.lazy(() =>
    import('../../../../components/common/Fields/Decimal').then(m => ({
      default: m.Decimal,
    }))
  ),
  year: React.lazy(() =>
    import('../../../../components/common/Fields/Year').then(m => ({
      default: m.Year,
    }))
  ),
  time: React.lazy(() =>
    import('../../../../components/common/Fields/Time').then(m => ({
      default: m.Time,
    }))
  ),
  datetime: React.lazy(() =>
    import('../../../../components/common/Fields/DateTime').then(m => ({
      default: m.DateTime,
    }))
  ),
  date: React.lazy(() =>
    import('../../../../components/common/Fields/DateField').then(m => ({
      default: m.DateField,
    }))
  ),
  boolean: React.lazy(() =>
    import('../../../../components/common/Fields/Checkbox').then(m => ({
      default: m.Checkbox,
    }))
  ),
  email: React.lazy(() =>
    import('../../../../components/common/Fields/Email').then(m => ({
      default: m.Email,
    }))
  ),
  select: React.lazy(() =>
    import('../../../../components/common/Fields/SingleSelect').then(m => ({
      default: m.SingleSelect,
    }))
  ),
  multiSelect: React.lazy(() =>
    import('../../../../components/common/Fields/MultiSelect').then(m => ({
      default: m.MultiSelect,
    }))
  ),
  longText: React.lazy(() =>
    import('../../../../components/common/Fields/LongText').then(m => ({
      default: m.LongText,
    }))
  ),
  url: React.lazy(() =>
    import('../../../../components/common/Fields/URL').then(m => ({
      default: m.URL,
    }))
  ),
  rating: React.lazy(() =>
    import('../../../../components/common/Fields/Rating').then(m => ({
      default: m.Rating,
    }))
  ),
  attachment: React.lazy(() =>
    import('../../../../components/common/Fields/Attachment').then(m => ({
      default: m.Attachment,
    }))
  ),
  user: React.lazy(() =>
    import('../../../../components/common/Fields/User').then(m => ({
      default: m.User,
    }))
  ),
  json: React.lazy(() =>
    import('../../../../components/common/Fields/JSONField').then(m => ({
      default: m.JSONField,
    }))
  ),
  createdTime: React.lazy(() =>
    import('../../../../components/common/Fields/AuditCreatedTime').then(
      m => ({ default: m.AuditCreatedTime })
    )
  ),
  lastModifiedTime: React.lazy(() =>
    import('../../../../components/common/Fields/AuditLastModifiedTime').then(
      m => ({ default: m.AuditLastModifiedTime })
    )
  ),
  createdBy: React.lazy(() =>
    import('../../../../components/common/Fields/AuditCreatedBy').then(m => ({
      default: m.AuditCreatedBy,
    }))
  ),
  lastModifiedBy: React.lazy(() =>
    import('../../../../components/common/Fields/AuditLastModifiedBy').then(
      m => ({ default: m.AuditLastModifiedBy })
    )
  ),
  phoneNumber: React.lazy(() =>
    import('../../../../components/common/Fields/PhoneNumber').then(m => ({
      default: m.PhoneNumber,
    }))
  ),
  percent: React.lazy(() =>
    import('../../../../components/common/Fields/Percent').then(m => ({
      default: m.Percent,
    }))
  ),
  duration: React.lazy(() =>
    import('../../../../components/common/Fields/Duration').then(m => ({
      default: m.Duration,
    }))
  ),
  currency: React.lazy(() =>
    import('../../../../components/common/Fields/Currency').then(m => ({
      default: m.Currency,
    }))
  ),
  links: React.lazy(() =>
    import('../../../../components/common/Fields/LinksField').then(m => ({
      default: m.LinksField,
    }))
  ),
  lookup: React.lazy(() =>
    import('../../../../components/common/Fields/Lookup').then(m => ({
      default: m.Lookup,
    }))
  ),
};

const FieldRenderer: React.FC<FieldRendererProps> = props => {
  const { type, ...rest } = props;
  const Component = typeComponentMap[type];


  if (!Component) {
    return <span className="text-red-400">Unsupported type: {type}</span>;
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-10 bg-gray-100 rounded animate-pulse" />
      }
    >
      <Component {...rest} />
    </Suspense>
  );
};

export default FieldRenderer;
