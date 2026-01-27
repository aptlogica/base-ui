import { useState, useEffect, useRef, useCallback } from 'react';
import { FormConfig, FormField } from '../../../types/form';
import { useToast } from '../../../components/common/Toast';

interface UseFormViewConfigOptions {
  view: any;
  formFields: FormField[];
  updateAppearance: (appearanceUpdates: Record<string, unknown>, view: any) => Promise<void>;
}

export function useFormViewConfig({
  view,
  formFields,
  updateAppearance,
}: UseFormViewConfigOptions) {
  const toast = useToast();

  // Form configuration state
  const persistedAppearance = view?.meta?.formViewAppearance;
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

  // Track the last synced view appearance to detect external changes
  const lastSyncedAppearanceRef = useRef<string>(JSON.stringify(view?.meta?.formViewAppearance || {}));
  
  // Sync formConfig with view when formViewAppearance changes externally (not during our own updates)
  useEffect(() => {
    // Skip if we're currently updating (to avoid overwriting our own changes)
    if (isUpdatingRef.current) {
      return;
    }
    
    const currentPersistedAppearance = view?.meta?.formViewAppearance;
    const currentAppearanceString = JSON.stringify(currentPersistedAppearance || {});
    const lastSyncedString = lastSyncedAppearanceRef.current;
    
    // Only sync if the view appearance actually changed externally
    if (currentAppearanceString !== lastSyncedString) {
      const currentFormTitle = currentPersistedAppearance?.formTitle;
      const currentFormDescription = currentPersistedAppearance?.formDescription;
      
      setFormConfig(prev => {
        // Check what changed
        const titleChanged = currentFormTitle !== undefined && currentFormTitle !== prev.title;
        const descriptionChanged = currentFormDescription !== undefined && currentFormDescription !== (prev.description || '');
        
        // Check if appearance properties changed
        const currentAppearance = prev.appearance || {};
        const appearanceChanged = currentPersistedAppearance && (
          currentAppearance.backgroundColor !== currentPersistedAppearance.backgroundColor ||
          currentAppearance.hideNocoBranding !== currentPersistedAppearance.hideNocoBranding ||
          currentAppearance.hideBanner !== currentPersistedAppearance.hideBanner ||
          currentAppearance.logoUrl !== currentPersistedAppearance.logoUrl ||
          currentAppearance.bannerUrl !== currentPersistedAppearance.bannerUrl ||
          currentAppearance.primaryColor !== currentPersistedAppearance.primaryColor ||
          currentAppearance.textColor !== currentPersistedAppearance.textColor ||
          currentAppearance.layoutWidth !== currentPersistedAppearance.layoutWidth ||
          currentAppearance.labelPosition !== currentPersistedAppearance.labelPosition ||
          currentAppearance.fieldLayout !== currentPersistedAppearance.fieldLayout ||
          currentAppearance.cardStyle !== currentPersistedAppearance.cardStyle ||
          currentAppearance.align !== currentPersistedAppearance.align ||
          currentAppearance.rounded !== currentPersistedAppearance.rounded
        );
        
        if (titleChanged || descriptionChanged || appearanceChanged) {
          const updated = {
            ...prev,
            ...(titleChanged && { title: currentFormTitle ?? view.title ?? 'Form' }),
            ...(descriptionChanged && { description: currentFormDescription ?? view.description ?? '' }),
            ...(appearanceChanged && {
              appearance: {
                backgroundColor: currentPersistedAppearance.backgroundColor ?? view.appearance?.backgroundColor ?? '#f8fafc',
                hideNocoBranding: currentPersistedAppearance.hideNocoBranding ?? view.appearance?.hideNocoBranding ?? false,
                hideBanner: currentPersistedAppearance.hideBanner ?? view.appearance?.hideBanner ?? false,
                logoUrl: currentPersistedAppearance.logoUrl ?? view.appearance?.logoUrl ?? undefined,
                bannerUrl: currentPersistedAppearance.bannerUrl ?? view.appearance?.bannerUrl ?? undefined,
                primaryColor: currentPersistedAppearance.primaryColor ?? view.appearance?.primaryColor ?? undefined,
                textColor: currentPersistedAppearance.textColor ?? view.appearance?.textColor ?? undefined,
                layoutWidth: currentPersistedAppearance.layoutWidth ?? view.appearance?.layoutWidth ?? 'medium',
                labelPosition: currentPersistedAppearance.labelPosition ?? view.appearance?.labelPosition ?? 'top',
                fieldLayout: currentPersistedAppearance.fieldLayout ?? view.appearance?.fieldLayout ?? 'list',
                cardStyle: currentPersistedAppearance.cardStyle ?? view.appearance?.cardStyle ?? 'flat',
                align: currentPersistedAppearance.align ?? view.appearance?.align ?? 'left',
                rounded: currentPersistedAppearance.rounded ?? view.appearance?.rounded ?? 'lg'
              }
            })
          };
          // Update the ref to track what we've synced
          lastSyncedAppearanceRef.current = currentAppearanceString;
          return updated;
        }
        // Update ref even if no changes needed
        lastSyncedAppearanceRef.current = currentAppearanceString;
        return prev;
      });
    }
  }, [view?.meta?.formViewAppearance, view?.title, view?.description, view?.appearance]);

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
            // Mark that we're updating to prevent sync useEffect from interfering
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
              ...latestConfig.appearance,
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
            
            // Update the last synced appearance ref to match what we just saved
            lastSyncedAppearanceRef.current = JSON.stringify(mergedAppearance);
            
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

