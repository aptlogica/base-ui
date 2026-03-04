import React, { useState, useEffect } from 'react';
import { Plus, X, HelpCircle, CloudUpload } from 'lucide-react';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { validateBaseName } from '../../utils/nameValidation';

interface CreateBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; image?: File | null }) => void;
  workspaceId: string;
  defaultName?: string;
  existingBases?: any[];
  isUpdate?: boolean;
  initialImage?: string | null;
}

const renderUploadButton = ({
  className,
  onDragOver,
  onDrop,
  onClick,
  onChange,
}: {
  className: string;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <button
    type="button"
    onDragOver={onDragOver}
    onDrop={onDrop}
    className={className}
    onClick={onClick}
  >
    <input
      type="file"
      id="image-upload"
      accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
      onChange={onChange}
      className="hidden"
    />
    <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
    <p className="text-sm text-gray-600 mb-1">
      <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
    </p>
    <p className="text-xs text-gray-500">
      SVG, PNG, JPG or GIF (max. 800 x 400px)
    </p>
  </button>
);

const renderImagePreview = ({
  imagePreview,
  onRemove,
}: {
  imagePreview: string;
  onRemove: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) => (
  <div className="relative flex-shrink-0">
    <button
      type="button"
      className="w-32 h-32 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:bg-green-200 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        document.getElementById('image-upload')?.click();
      }}
    >
      <img
        src={imagePreview}
        alt="Preview"
        className="w-full h-full object-cover"
      />
    </button>
    <button
      type="button"
      onClick={onRemove}
      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-primary rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
    >
      <X size={12} />
    </button>
  </div>
);

export const CreateBaseModal: React.FC<CreateBaseModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  workspaceId: _workspaceId,
  defaultName = '',
  existingBases = [],
  isUpdate = false,
  initialImage = null,
}) => {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setDescription('');
      setImage(null);
      setImagePreview(initialImage);
      setError('');
      setValidationError('');
      setImageError('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultName, initialImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setImageError('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
        return;
      }

      // Validate dimensions (max 800x400) but keep invalid images visible
      const img = new Image();
      img.onload = () => {
        if (img.width > 800 || img.height > 400) {
          setImageError('Image dimensions must be max 800 x 400px');
        } else {
          setImageError('');
        }
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
      };
      img.onerror = () => {
        setImageError('Failed to load image. Please try again.');
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) {
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (validTypes.includes(file.type)) {
        const img = new Image();
        img.onload = () => {
          if (img.width > 800 || img.height > 400) {
            setImageError('Image dimensions must be max 800 x 400px');
          } else {
            setImageError('');
          }
          setImage(file);
          setImagePreview(URL.createObjectURL(file));
        };
        img.onerror = () => {
          setImageError('Failed to load image. Please try again.');
          setImage(file);
          setImagePreview(URL.createObjectURL(file));
        };
        img.src = URL.createObjectURL(file);
      } else {
        setImageError('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
      }
    }
  };

  // Validate name on change
  useEffect(() => {
    if (name.trim()) {
      const validation = validateBaseName(name, existingBases);
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingBases]);

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Base name is required');
      return;
    }

    // Check validation
    const validation = validateBaseName(name, existingBases);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid base name');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      onCreate({
        name: name.trim(),
        description: description.trim(),
        image: image || null,
      });
      // Close the modal on successful creation
      onClose();
    } catch (err) {
      setError('Failed to create base. Please try again.' + (err instanceof Error ? err.message : ''));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Helper function to get help icon color based on validation state
  const getHelpIconColor = (): string => {
    if (validationError) {
      return 'text-red-500';
    }
    if (name.trim().length >= 3) {
      return 'text-green-600';
    }
    return 'text-gray-400';
  };

  // Helper function to get button text based on state
  const getButtonText = (): string => {
    if (isUpdate) {
      return 'Update';
    }
    return 'Create Base';
  };

  // Helper function to get loading button text based on state
  const getLoadingButtonText = (): string => {
    if (isUpdate) {
      return 'Updating...';
    }
    return 'Creating...';
  };

  if (!isOpen) return null;

  return (
    <div //NOSONAR
      className="bg-modal-backdrop relative"
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div // NOSONAR
        className="bg-modal !max-w-3xl !p-0 flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Plus className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">{isUpdate ? 'Update Base' : 'Create Base'}</h2>
              <p className="text-sm text-secondary truncate">{isUpdate ? 'Update base details' : 'Add a new base to your workspace'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="text-[var(--text-color-tertiary)] h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Area */}
        <form id="create-base-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
            <div className="space-y-1">
              <label htmlFor="baseName" className="block text-sm font-medium text-primary mb-1">
                Base Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="baseName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter base name"
                  className={`field-component field-component-border field-component-focus ${error || validationError ? 'border-red-500' : 'border'}`}
                  required
                  minLength={3}
                  maxLength={50}
                  autoFocus
                />
                <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                  <span className="relative inline-block group">
                    <HelpCircle className={`w-4 h-4 ${getHelpIconColor()} cursor-help`} />
                    <div className="invisible group-hover:visible absolute right-0 mt-1 mr-2 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                      <h4 className="font-medium text-primary mb-2">Base name requirements:</h4>
                      <ul className="space-y-1">
                        <li className={`flex items-center ${name.trim().length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                          • Minimum 3 characters
                        </li>
                      </ul>
                    </div>
                  </span>
                </div>
              </div>
              {/* Validation Error - Only show name-related errors here */}
              {(error || validationError) && (
                <div className="mt-1 text-sm text-red-600">
                  <span>{validationError || error}</span>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {name.length}/50 characters
              </p>
            </div>

            <MultiLineText
              label="Description"
              value={description}
              onChange={value => setDescription(value)}
              placeholder="Enter base description"
              rows={5}
              isBorder={true}
            />

            {/* Image Upload Section */}
            <div className="space-y-1">
              <label htmlFor="image-upload" className="block text-sm font-medium text-primary mb-1">
                Image
              </label>
              {imagePreview ? (
                <div className="flex gap-4">
                  {/* Image Preview - Left Side */}
                  {renderImagePreview({
                    imagePreview,
                    onRemove: (e) => {
                      e.stopPropagation();
                      setImage(null);
                      setImagePreview(null);
                      setImageError('');
                      const input = document.getElementById('image-upload') as HTMLInputElement;
                      if (input) input.value = '';
                    }
                  })}

                  {/* Upload Area - Right Side */}
                  {renderUploadButton({
                    className: 'flex-1 relative border-2 border-dashed rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer',
                    onDragOver: handleDragOver,
                    onDrop: handleDrop,
                    onClick: (e) => {
                      e.stopPropagation();
                      document.getElementById('image-upload')?.click();
                    },
                    onChange: handleImageChange,
                  })}
                </div>
              ) : (
                renderUploadButton({
                  className: 'relative w-full border-2 border-dashed rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer',
                  onDragOver: handleDragOver,
                  onDrop: handleDrop,
                  onClick: (e) => {
                    e.stopPropagation();
                    document.getElementById('image-upload')?.click();
                  },
                  onChange: handleImageChange,
                })
              )}
              {/* Image Error - Display here, not under Base Name */}
              {imageError && (
                <div className="mb-2 text-sm text-red-600">
                  <span>{imageError}</span>
                </div>
              )}
            </div>

          </div>
        </form>

        {/* Footer - Fixed at Bottom */}
        <div className="flex items-center justify-end gap-3 p-4 border-t flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            disabled={isSubmitting || !name.trim() || name.trim().length < 3 || !!imageError}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                {getLoadingButtonText()}
              </>
            ) : (
              getButtonText()
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 
