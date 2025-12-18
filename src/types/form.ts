// Centralized form types for FormView and its children

export interface FormField {
  id: string;
  name: string;
  type: string;
  label: string;
  required?: boolean;
  enabled?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  [key: string]: unknown;
  config?: {
    [key: string]: unknown;
  };
  // Additional API properties
  title?: string;
  column_name?: string;
  uidt?: string;
  meta?: {
    [key: string]: unknown;
  };
  virtual?: boolean;
  system?: boolean;
  order_index?: number;
  is_hidden?: boolean;
  isSystem?: boolean;
}

export interface FormConfig {
  title: string;
  description?: string;
  fields: FormField[];
  appearance?: {
    backgroundColor?: string;
    hideNocoBranding?: boolean;
    hideBanner?: boolean;
    logoUrl?: string;
    bannerUrl?: string;
    primaryColor?: string;
    textColor?: string;
    layoutWidth?: 'narrow' | 'medium' | 'wide' | 'full';
    labelPosition?: 'top' | 'left';
    fieldLayout?: 'list' | 'grid-2';
    cardStyle?: 'flat' | 'elevated';
    align?: 'left' | 'center';
    rounded?: 'none' | 'md' | 'lg' | 'xl';
    [key: string]: unknown;
  };
  submission?: {
    redirectUrl?: string;
    showSubmitAnother?: boolean;
    showBlankForm?: boolean;
    emailNotification?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
} 