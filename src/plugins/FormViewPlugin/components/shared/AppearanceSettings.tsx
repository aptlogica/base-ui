import React, { useRef } from 'react';
import { FormConfig } from '../../../../types/form';
import AdvancedDropdown from '../../../../components/common/dropdown/AdvancedDropdown';
import { useAddImage } from '../../../../hooks/useApi';
import { useToast } from '../../../../components/common/Toast';
import { Upload, Link2, ImageUp, Trash2 } from 'lucide-react';

// Helper to extract filename from a URL
const getImageName = (url: string) => {
  try {
    return url.split('/').pop() || '';
  } catch {
    return '';
  }
};

// Helper function to detect if URL is from file upload (localhost or assets path)
const isFileUploadUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'localhost' || urlObj.pathname.includes('/assets/');
  } catch {
    // If URL parsing fails, check if it contains assets path
    return url.includes('/assets/');
  }
};

interface AppearanceSettingsProps {
  appearance: FormConfig['appearance'];
  onChange: (appearance: FormConfig['appearance']) => void;
}

const colorOptions = [
  '#ffffff', '#fefce8', '#f0fdf4',
  '#eff6ff', '#faf5ff', '#fdf2f8', '#ff6b6b', '#4ecdc4', '#3d3d3d', '#262626'
];

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  appearance = {},
  onChange
}) => {
  // Normalize appearance to a fully-typed local variable to avoid undefined/implicit any issues
  const ap = (appearance ?? {}) as NonNullable<FormConfig['appearance']>;
  // Local validation state for URLs so we don't write invalid URLs into view.meta
  const [logoError, setLogoError] = React.useState<string | null>(null);
  const [bannerError, setBannerError] = React.useState<string | null>(null);
  // Initialize showLogoUrlInput based on whether URL exists AND is not from file upload
  const [showLogoUrlInput, setShowLogoUrlInput] = React.useState<boolean>(() => {
    const hasLogoUrl = !!(appearance as any)?.logoUrl;
    if (!hasLogoUrl) return false;
    // If URL exists but looks like it came from file upload, don't show URL input
    return !isFileUploadUrl((appearance as any)?.logoUrl);
  });
  const [logoFileName, setLogoFileName] = React.useState<string | null>(null);
  const [bannerFileName, setBannerFileName] = React.useState<string | null>(null);
  // Initialize showBannerUrlInput based on whether URL exists AND is not from file upload
  const [showBannerUrlInput, setShowBannerUrlInput] = React.useState<boolean>(() => {
    const hasBannerUrl = !!(appearance as any)?.bannerUrl;
    if (!hasBannerUrl) return false;
    // If URL exists but looks like it came from file upload, don't show URL input
    return !isFileUploadUrl((appearance as any)?.bannerUrl);
  });
  const [uploadingLogo, setUploadingLogo] = React.useState<boolean>(false);
  const [uploadingBanner, setUploadingBanner] = React.useState<boolean>(false);
  const [logoFromBrowse, setLogoFromBrowse] = React.useState<boolean>(false);
  const [bannerFromBrowse, setBannerFromBrowse] = React.useState<boolean>(false);

  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoUrlInputRef = useRef<HTMLInputElement>(null);
  const bannerUrlInputRef = useRef<HTMLInputElement>(null);
  const logoReplaceInputRef = useRef<HTMLInputElement>(null);
  const bannerReplaceInputRef = useRef<HTMLInputElement>(null);

  const addImageMutation = useAddImage();
  const toast = useToast();

  React.useEffect(() => {
    if (showLogoUrlInput) {
      logoUrlInputRef.current?.focus();
    }
  }, [showLogoUrlInput]);

  React.useEffect(() => {
    if (showBannerUrlInput) {
      bannerUrlInputRef.current?.focus();
    }
  }, [showBannerUrlInput]);

  // When a URL is provided (paste or persisted), derive a filename for display if not already set from upload
  React.useEffect(() => {
    if (ap.logoUrl && !logoFileName) {
      const fileName = getImageName(String(ap.logoUrl));
      if (fileName) {
        setLogoFileName(fileName);
        // If URL is from file upload, ensure URL input is hidden
        if (isFileUploadUrl(String(ap.logoUrl))) {
          setShowLogoUrlInput(false);
          setLogoFromBrowse(true);
        }
      }
    }
  }, [ap.logoUrl, logoFileName]);

  React.useEffect(() => {
    if (ap.bannerUrl && !bannerFileName) {
      const fileName = getImageName(String(ap.bannerUrl));
      if (fileName) {
        setBannerFileName(fileName);
        // If URL is from file upload, ensure URL input is hidden
        if (isFileUploadUrl(String(ap.bannerUrl))) {
          setShowBannerUrlInput(false);
          setBannerFromBrowse(true);
        }
      }
    }
  }, [ap.bannerUrl, bannerFileName]);

  const validateUrl = (val: string) => {
    if (!val) return true;
    try {
      // allow relative urls? We assume absolute for images; require protocol
      const parsed = new URL(val);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (err) {
      console.warn(err)
    }
  };

  const handleColorChange = (color: string) => {
    onChange({ ...ap, backgroundColor: color });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { title: 'Invalid File Type' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB', { title: 'File Too Large' });
      return;
    }

    // Save selected filename in state
    if (type === 'logo') {
      setLogoFileName(file.name);
      setLogoFromBrowse(true);
      setShowLogoUrlInput(false); // Hide URL input when uploading via file
    } else {
      setBannerFileName(file.name);
      setBannerFromBrowse(true);
      setShowBannerUrlInput(false); // Hide URL input when uploading via file
    }

    // mark respective upload as in-progress
    if (type === 'logo') {
      setUploadingLogo(true);
    } else {
      setUploadingBanner(true);
    }

    try {
      const response:any = await addImageMutation.mutateAsync({
        files: [file],
      });

      // Extract image URL from response (following the same pattern as account settings)
      // The response structure may vary, so we'll check multiple possible paths
      let imageUrl = '';
      if (response?.data?.data?.url) {
        imageUrl = response.data.data.url;
      } else if (response?.data?.url) {
        imageUrl = response.data.url;
      } else if (response?.data?.data?.[0]?.url) {
        imageUrl = response.data.data[0].url;
      } else if (response?.data?.[0]?.url) {
        imageUrl = response.data[0].url;
      } else if (typeof response?.data === 'string') {
        imageUrl = response.data;
      } else if (response?.data?.data?.[0]) {
        // If response.data.data is an array with the first item being the URL string
        imageUrl = response.data.data[0];
      }

      if (imageUrl) {
        if (type === 'logo') {
          onChange({ ...ap, logoUrl: imageUrl });
          toast.success('Logo uploaded successfully!', { title: 'Success' });
        } else {
          onChange({ ...ap, bannerUrl: imageUrl });
          toast.success('Banner uploaded successfully!', { title: 'Success' });
        }
      } else {
        toast.error('Failed to get image URL from response', { title: 'Upload Failed' });
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload image. Please try again.', { title: 'Upload Failed' });
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-base font-medium text-gray-900 mb-4">Appearance settings</h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Background Color
            </label>
            <div className="flex gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-10 h-10 rounded-xl border-2 transition-all ${ap.backgroundColor === color
                    ? 'border scale-110'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Primary/Text color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <input
                type="color"
                value={(ap.primaryColor as string) || '#2563eb'}
                onChange={(e) => onChange({ ...ap, primaryColor: e.target.value })}
                className="h-8 p-0 w-full bg-none outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
              <input
                type="color"
                value={(ap.textColor as string) || '#111827'}
                onChange={(e) => onChange({ ...ap, textColor: e.target.value })}
                className="h-8 p-0 w-full bg-none outline-none"
              />
            </div>
          </div>

          {/* Branding toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Hide Branding</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!ap.hideNocoBranding}
                onChange={(e) => onChange({ ...ap, hideNocoBranding: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${ap.hideNocoBranding ? 'bg-[var(--color-bg-brand-primary)]' : 'bg-gray-200'
                }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${ap.hideNocoBranding ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
              </div>
            </label>
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            {!(ap.logoUrl && !logoError && !showLogoUrlInput) && (
              <div className="flex gap-1 w-full ">
                {!showLogoUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowLogoUrlInput(true)}
                    className="px-3 py-2 flex-1 border border-gray-300 rounded-xl text-sm font-medium text-[var(--color-gray-700)] bg-background hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Link2 size={16} />
                    <span>Insert via URL</span>
                  </button>
                ) : (
                  <div className="flex-1">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={(ap.logoUrl as string) || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || validateUrl(v)) {
                          setLogoError(null);
                          onChange({ ...ap, logoUrl: v });
                          setLogoFromBrowse(false);
                        } else {
                          setLogoError('Invalid URL');
                        }
                      }}
                      ref={logoUrlInputRef}
                      className={`w-full field-component field-component-border field-component-focus ${logoError ? 'border-red-500' : ''}`}
                    />
                  </div>

                )}
                <input
                  type="file"
                  ref={logoFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'logo')}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                {!showLogoUrlInput && (
                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-3 py-2 border border-gray-300 flex-1 rounded-xl text-sm font-medium text-[var(--color-gray-700)] bg-background hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingLogo ? (
                      <>
                        <div className="w-4 h-4 border rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Browse</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            {logoError && <p className="text-xs text-red-600 mt-1">{logoError}</p>}
            {ap.logoUrl && !logoError && (
              <div className="mt-2 bg-card rounded-xl p-1.5 border flex items-center gap-3">
                <img src={String(ap.logoUrl)} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Logo</p>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type="file"
                    ref={logoReplaceInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  {logoFromBrowse && (
                    <button
                      type="button"
                      onClick={() => logoReplaceInputRef.current?.click()}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Change logo"
                    >
                      <ImageUp size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...ap, logoUrl: '' });
                      setLogoFileName(null);
                      setShowLogoUrlInput(false);
                      setLogoFromBrowse(false);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Banner URL */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Hide Banner</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!ap.hideBanner}
                onChange={(e) => onChange({ ...ap, hideBanner: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-11 h-6 rounded-full transition-colors ${ap.hideBanner ? 'bg-[var(--color-bg-brand-primary)]' : 'bg-gray-200'
                }`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${ap.hideBanner ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`} />
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner</label>
            {!(ap.bannerUrl && !bannerError && !showBannerUrlInput) && (
              <div className="flex gap-2">
                {showBannerUrlInput ? (
                  <>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={(ap.bannerUrl as string) || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || validateUrl(v)) {
                          setBannerError(null);
                          onChange({ ...ap, bannerUrl: v });
                          setBannerFromBrowse(false);
                        } else {
                          setBannerError('Invalid URL');
                        }
                      }}
                      ref={bannerUrlInputRef}
                      className={`flex-1 field-component field-component-border field-component-focus ${bannerError ? 'border-red-500' : ''}`}
                    />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowBannerUrlInput(true)}
                    className="px-3 py-2 flex-1 border border-gray-300 rounded-xl text-sm font-medium text-[var(--color-gray-700)] bg-background hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Link2 size={16} />
                    <span>Insert via URL</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'banner')}
                  className="hidden"
                  disabled={uploadingBanner}
                />
                {!showBannerUrlInput && (
                  <button
                    type="button"
                    onClick={() => bannerFileInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="px-3 py-2 flex-1 border border-gray-300 rounded-xl text-sm font-medium text-[var(--color-gray-700)] bg-background hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingBanner ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Browse</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
            {bannerError && <p className="text-xs text-red-600 mt-1">{bannerError}</p>}
            {ap.bannerUrl && !bannerError && (
              <div className="mt-2 bg-card border rounded-xl p-1.5 flex items-center gap-3">
                <img src={String(ap.bannerUrl)} alt="Banner preview" className="h-12 w-20 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Banner</p>
                </div>
                <div className='flex items-center gap-2'>
                  <input
                    type="file"
                    ref={bannerReplaceInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'banner')}
                    className="hidden"
                    disabled={uploadingBanner}
                  />
                  {bannerFromBrowse && (
                    <button
                      type="button"
                      onClick={() => bannerReplaceInputRef.current?.click()}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Change banner"
                    >
                      <ImageUp size={18} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ ...ap, bannerUrl: '' });
                      setBannerFileName(null);
                      setShowBannerUrlInput(false);
                      setBannerFromBrowse(false);
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Remove banner"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Layout width */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layout Width</label>
              <AdvancedDropdown<string>
                options={[
                  { label: 'Narrow', value: 'narrow' },
                  { label: 'Medium', value: 'medium' },
                  { label: 'Wide', value: 'wide' },
                  { label: 'Full Width', value: 'full' },
                ]}
                value={(ap.layoutWidth as string) || 'wide'}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  onChange({ ...(ap as any), layoutWidth: v as any });
                }}
                placeholder="Select width"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title Alignment</label>
              <AdvancedDropdown<string>
                options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }]}
                value={(ap.align as string) || 'left'}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  onChange({ ...(ap as any), align: v as any });
                }}
                placeholder="Title alignment"
              />
            </div>
          </div>

          {/* Label position & Field layout */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label Position</label>
              <AdvancedDropdown<string>
                options={[{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }]}
                value={(ap.labelPosition as string) || 'top'}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  onChange({ ...(ap as any), labelPosition: v as any });
                }}
                placeholder="Label position"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field Layout</label>
              <AdvancedDropdown<string>
                options={[
                  { label: 'List', value: 'list' },
                  { label: 'Grid', value: 'grid-2' }
                ]}
                value={(ap.fieldLayout as string) || 'list'}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  onChange({ ...(ap as any), fieldLayout: v as any });
                }}
                placeholder="Field layout"
              />
            </div>
          </div>

          {/* Card style & Rounded */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Style</label>
              <AdvancedDropdown<string>
                options={[{ label: 'Flat', value: 'flat' }, { label: 'Elevated', value: 'elevated' }]}
                value={(ap.cardStyle as string) || 'flat'}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  onChange({ ...(ap as any), cardStyle: v as any });
                }}
                placeholder="Card style"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rounded Corners</label>
              <AdvancedDropdown<string>
                options={[
                  { label: 'None', value: 'none' },
                  { label: 'Medium', value: 'md' },
                  { label: 'Large', value: 'lg' },
                  { label: 'Extra Large', value: 'xl' },
                ]}
                value={(ap.rounded as string) || 'md'}
                onChange={(val: string | string[]) => {
                  const v = Array.isArray(val) ? val[0] : val;
                  onChange({ ...(ap as any), rounded: v as any });
                }}
                placeholder="Rounded corners"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};