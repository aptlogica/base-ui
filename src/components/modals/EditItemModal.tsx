import React, { useState, useEffect } from 'react';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { X, HelpCircle, PencilLine, CloudUpload } from 'lucide-react';
import { validateTableName, validateViewName, validateBaseName, ExistingItem } from '../../utils/nameValidation';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; description: string; image?: File | null; removeImage?: boolean }) => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  initialName?: string;
  initialDescription?: string;
  itemType: 'table' | 'view' | 'base' | 'workspace';
  existingItems?: ExistingItem[];
  currentItemId?: string;
  initialImage?: string | null;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  icon: _icon, // Keep in props for backward compatibility but not used
  initialName,
  initialDescription,
  itemType,
  existingItems = [],
  currentItemId,
  initialImage = null,
}) => {
  // Ensure local state is always a string so calls to `trim()` are safe
  const [name, setName] = useState(initialName ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [imageError, setImageError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Use nullish coalescing to avoid setting `undefined` which would break `trim()`
      setName(initialName ?? '');
      setDescription(initialDescription ?? '');
      setImage(null);
      setImagePreview(initialImage);
      setError('');
      setValidationError('');
      setImageError('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialName, initialDescription, initialImage]);

  // Real-time validation on name change
  useEffect(() => {
    if (isOpen && name.trim()) {
      let validation;
      switch (itemType) {
        case 'table':
          validation = validateTableName(name, existingItems, currentItemId);
          break;
        case 'view':
          validation = validateViewName(name, existingItems, currentItemId);
          break;
        case 'base':
          validation = validateBaseName(name, existingItems, currentItemId);
          break;
        default:
          validation = { isValid: true };
      }
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [name, existingItems, currentItemId, itemType, isOpen]);

  // Image upload handlers (only for base type)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setImageError('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
        return;
      }
      
      // Set image and preview immediately (so it's available for submission)
      const previewUrl = URL.createObjectURL(file);
      setImage(file);
      setImagePreview(previewUrl);
      setImageError('');
      
      // Validate dimensions asynchronously (show error if invalid, but keep the image)
      const img = new Image();
      img.onload = () => {
        if (img.width > 800 || img.height > 400) {
          // Keep the image but show error - user can remove it manually
          setImageError('Image dimensions must be max 800 x 400px');
        }
      };
      img.onerror = () => {
        // Keep the image but show error - user can remove it manually
        setImageError('Failed to load image. Please try again.');
      };
      img.src = previewUrl;
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
        // Set image and preview immediately (so it's available for submission)
        const previewUrl = URL.createObjectURL(file);
        setImage(file);
        setImagePreview(previewUrl);
        setImageError('');
        
        // Validate dimensions asynchronously (show error if invalid, but keep the image)
        const img = new Image();
        img.onload = () => {
          if (img.width > 800 || img.height > 400) {
            setImageError('Image dimensions must be max 800 x 400px');
          }
        };
        img.onerror = () => {
          setImageError('Failed to load image. Please try again.');
        };
        img.src = previewUrl;
      } else {
        setImageError('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
      }
    }
  };

  // Get help icon color class based on validation state - extracted to avoid nested ternary
  const getHelpIconColorClass = (): string => {
    if (validationError) {
      return 'text-red-500';
    }
    if (name.trim().length >= 3) {
      return 'text-green-600';
    }
    return 'text-gray-400';
  };

  const handleSubmit = async (e:React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} name is required`);
      return;
    }

    // Validate name based on item type
    let validation;
    switch (itemType) {
      case 'table':
        validation = validateTableName(name.trim(), existingItems, currentItemId);
        break;
      case 'view':
        validation = validateViewName(name.trim(), existingItems, currentItemId);
        break;
      case 'base':
        validation = validateBaseName(name.trim(), existingItems, currentItemId);
        break;
      default:
        validation = { isValid: true };
    }

    if (!validation.isValid) {
      setError(validation.error || 'Invalid name');
      return;
    }

    setError('');
    setValidationError('');
    setImageError('');
    setIsSubmitting(true);

    try {
      const saveData: { name: string; description: string; image?: File | null; removeImage?: boolean } = {
        name: name.trim(),
        description: description.trim(),
      };
      
      // Include image for base type (File for new upload, null for removal)
      if (itemType === 'base') {
        // If image is a File, include it for upload
        if (image instanceof File) {
          saveData.image = image;
        }
        // If image is null but initialImage was set, user explicitly removed it
        else if (image === null && initialImage) {
          saveData.removeImage = true;
        }
      }
      
      onSave(saveData);
      // Close the modal on successful save
      onClose();
    } catch (err) {
      console.error(`Failed to save ${itemType}:`, err);
      setError(`Failed to update ${itemType}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
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
      <div
        className="bg-modal !p-0 flex flex-col relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <PencilLine className="text-green-600 h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-primary truncate">{title}</h2>
              <p className="text-sm text-secondary truncate">{subtitle}</p>
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
        <form id="edit-item-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <div className="p-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="itemName" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              {itemType.charAt(0).toUpperCase() + itemType.slice(1)} Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="itemName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Enter ${itemType} name`}
                className={`field-component field-component-border field-component-focus ${error || validationError ? 'border-red-500' : 'border'}`}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${getHelpIconColorClass()} cursor-help`} />
                  <div className="invisible group-hover:visible absolute right-0 mt-1 mr-2 w-64 bg-card border rounded-xl shadow-lg p-3 text-sm z-50">
                    <h4 className="font-medium text-primary mb-2">{itemType.charAt(0).toUpperCase() + itemType.slice(1)} name requirements:</h4>
                    <ul className="space-y-1">
                      <li className={`flex items-center ${name.trim().length >= 3 ? 'text-green-600' : 'text-gray-500'}`}>
                        • Minimum 3 characters
                      </li>
                    </ul>
                  </div>
                </span>
              </div>
            </div>
            {/* Validation Error */}
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
            placeholder={`Enter ${itemType} description`}
            value={description}
            onChange={value => setDescription(value)}
            rows={5}
            isBorder={true}
          />

          {/* Image Upload Section - Only for base type */}
          {itemType === 'base' && (
            <div className="space-y-1">
              <label htmlFor="edit-image-upload" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
                Image
              </label>
              <input
                type="file"
                id="edit-image-upload"
                accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
                onChange={handleImageChange}
                className="hidden"
                aria-label="Upload image"
              />
              {imagePreview ? (
                <div className="flex gap-4">
                  {/* Image Preview - Left Side */}
                  <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        setImagePreview(null);
                        setImageError('');
                        const input = document.getElementById('edit-image-upload') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-primary rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  
                  {/* Upload Area - Right Side */}
                  <div //NOSONAR
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="flex-1 relative border-dashed border rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('edit-image-upload')?.click()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      SVG, PNG, JPG or GIF (max. 800 x 400px)
                    </p>
                  </div>
                </div>
              ) : (
                <div //NOSONAR
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="relative border-dashed border rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('edit-image-upload')?.click()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-green-500 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    SVG, PNG, JPG or GIF (max. 800 x 400px)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Image Error - Display here, not under Base Name */}
          {itemType === 'base' && imageError && (
            <div className="mb-2 text-sm text-red-600">
              <span>{imageError}</span>
            </div>
          )}

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
            disabled={isSubmitting || !name.trim() || name.trim().length < 3 || !!validationError || (itemType === 'base' && !!imageError)}
            className="flex items-center gap-2 px-16 py-2 rounded-xl btn-primary font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 
