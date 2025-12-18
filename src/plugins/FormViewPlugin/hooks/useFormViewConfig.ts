import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '../../../utils/helpers';
import { FormConfig } from '../../../types/form';
import { useToast } from '../../../components/common/Toast';

interface UseFormViewConfigOptions {
  view: any;
  formFields: any[];
  updateAppearance: (appearanceUpdates: any, view: any) => Promise<void>;
}

export function useFormViewConfig({
  view,
  formFields,
  updateAppearance,
}: UseFormViewConfigOptions) {
  const toast = useToast();

  // Form configuration state
  const persistedAppearance = (view?.meta as any)?.formViewAppearance;
  const initialAppearance = persistedAppearance || view.appearance || {};

  // Load form-specific title and description from formViewAppearance, fallback to view title/description
  const persistedFormTitle = persistedAppearance?.formTitle;
  const persistedFormDescription = persistedAppearance?.formDescription;

  const [formConfig, setFormConfig] = useState<FormConfig>(() => ({
    title: (persistedFormTitle ?? view.title) || 'Form',
    description: (persistedFormDescription ?? view.description) || '',
    fields: formFields,
    appearance: {
      backgroundColor: initialAppearance?.backgroundColor ?? view.appearance?.backgroundColor ?? '#f8fafc',
      hideNocoBranding: initialAppearance?.hideNocoBranding ?? view.appearance?.hideNocoBranding ?? false,
      hideBanner: initialAppearance?.hideBanner ?? view.appearance?.hideBanner ?? false,
      logoUrl: initialAppearance?.logoUrl ?? view.appearance?.logoUrl ?? undefined,
      bannerUrl: initialAppearance?.bannerUrl ?? view.appearance?.bannerUrl ?? undefined,
      primaryColor: initialAppearance?.primaryColor ?? view.appearance?.primaryColor ?? undefined,
      textColor: initialAppearance?.textColor ?? view.appearance?.textColor ?? undefined,
      layoutWidth: initialAppearance?.layoutWidth ?? view.appearance?.layoutWidth ?? 'medium',
      labelPosition: initialAppearance?.labelPosition ?? view.appearance?.labelPosition ?? 'top',
      fieldLayout: initialAppearance?.fieldLayout ?? view.appearance?.fieldLayout ?? 'list',
      cardStyle: initialAppearance?.cardStyle ?? view.appearance?.cardStyle ?? 'flat',
      align: initialAppearance?.align ?? view.appearance?.align ?? 'left',
      rounded: initialAppearance?.rounded ?? view.appearance?.rounded ?? 'lg'
    },
    submission: {
      showSubmitAnother: view.submission?.showSubmitAnother || false,
      showBlankForm: view.submission?.showBlankForm || false,
    }
  }));

  // Single ref for debouncing all persistence (prevents duplicate API calls)
  const persistenceDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isUpdatingRef = useRef<boolean>(false);
  const viewRef = useRef(view);
  const updateAppearanceRef = useRef(updateAppearance);
  const formConfigRef = useRef(formConfig);

  useEffect(() => {
    viewRef.current = view;
    updateAppearanceRef.current = updateAppearance;
  }, [view, updateAppearance]);

  // Keep formConfig ref in sync
  useEffect(() => {
    formConfigRef.current = formConfig;
  }, [formConfig]);

  // Keep formConfig.fields in sync when columns or view fieldConfig change
  useEffect(() => {
    setFormConfig(prev => ({ ...prev, fields: formFields }));
  }, [formFields]);

  // Unified handler for all config changes - prevents duplicate API calls
  const handleConfigChange = useCallback((updatedConfig: Partial<FormConfig>) => {
    setFormConfig((prev) => {
      const merged = { ...prev, ...(updatedConfig as any) } as FormConfig;
      formConfigRef.current = merged;

      // Clear any existing debounce timer
      if (persistenceDebounceRef.current) {
        clearTimeout(persistenceDebounceRef.current);
      }

      // Only persist if there are actual changes and view exists
      const hasChanges = 
        (updatedConfig.title !== undefined || 
         updatedConfig.description !== undefined || 
         updatedConfig.appearance !== undefined) && 
        viewRef.current?.id;

      if (hasChanges) {
        // Single debounced handler for all updates (title, description, appearance)
        persistenceDebounceRef.current = setTimeout(async () => {
          // Prevent duplicate calls if already updating
          if (isUpdatingRef.current) {
            return;
          }

          try {
            isUpdatingRef.current = true;

            // Get current formViewAppearance from meta
            const currentMeta = viewRef.current?.meta || {};
            const currentFormViewAppearance = currentMeta.formViewAppearance || {};
            
            // Get latest formConfig (may have changed during debounce)
            const latestConfig = formConfigRef.current;
            
            // Build merged appearance with all updates
            const mergedAppearance = {
              ...currentFormViewAppearance,
              // Include appearance updates
              ...(latestConfig.appearance || {}),
              // Include title/description if they exist in config
              ...(latestConfig.title !== undefined && { formTitle: latestConfig.title }),
              ...(latestConfig.description !== undefined && { formDescription: latestConfig.description }),
            };

            // Skip if nothing actually changed (prevents unnecessary API calls)
            const appearanceString = JSON.stringify(mergedAppearance);
            const existingAppearanceString = JSON.stringify(currentFormViewAppearance);
            if (appearanceString === existingAppearanceString) {
              isUpdatingRef.current = false;
              return;
            }
            
            await updateAppearanceRef.current(mergedAppearance, viewRef.current);
            
            // Show appropriate success message
            const hasTitleOrDesc = latestConfig.title !== undefined || latestConfig.description !== undefined;
            const hasAppearance = latestConfig.appearance !== undefined;
            
            if (hasTitleOrDesc && hasAppearance) {
              toast.success('Form settings saved successfully!');
            } else if (hasTitleOrDesc) {
              toast.success('Form settings saved successfully!');
            } else {
            toast.success('Appearance saved successfully!');
            }
          } catch (err: any) {
            console.error('Failed to persist form settings', err);
            toast.error('Failed to save settings');
          } finally {
            isUpdatingRef.current = false;
          }
        }, 700);
      }

      return merged;
    });
  }, [toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (persistenceDebounceRef.current) clearTimeout(persistenceDebounceRef.current as any);
    };
  }, []);

  return {
    formConfig,
    setFormConfig,
    handleConfigChange,
  };
}

