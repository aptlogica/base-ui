import React, { useState, useEffect } from 'react';
import { Plus, X, HelpCircle, CloudUpload } from 'lucide-react';
import { MultiLineText } from '../common/Fields/MultiLineText';
import { validateBaseName } from '../../utils/nameValidation';

interface CreateBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string }) => void;
  workspaceId: string;
  defaultName?: string;
  existingBases?: any[];
  isUpdate?: boolean;
  initialImage?: string | null;
}

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
  const [_image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
      setDescription('');
      setImage(null);
      setImagePreview(initialImage);
      setError('');
      setValidationError('');
      setIsSubmitting(false);
    }
  }, [isOpen, defaultName, initialImage]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
        return;
      }
      
      // Validate dimensions (max 800x400)
      const img = new Image();
      img.onload = () => {
        if (img.width > 800 || img.height > 400) {
          setError('Image dimensions must be max 800 x 400px');
          return;
        }
        setImage(file);
        setImagePreview(URL.createObjectURL(file));
        setError('');
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
    if (file && file.type.startsWith('image/')) {
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
      if (validTypes.includes(file.type)) {
        const img = new Image();
        img.onload = () => {
          if (img.width <= 800 && img.height <= 400) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
            setError('');
          } else {
            setError('Image dimensions must be max 800 x 400px');
          }
        };
        img.src = URL.createObjectURL(file);
      } else {
        setError('Please upload a valid image file (SVG, PNG, JPG, or GIF)');
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await onCreate({
        name: name.trim(),
        description: description.trim(),
      });
      // Close the modal on successful creation
      onClose();
    } catch (err) {
      setError('Failed to create base. Please try again.');
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
    <div
      className="bg-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="bg-modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-bg-brand-primary)] rounded-full flex items-center justify-center flex-shrink-0">
              <Plus size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-primary">{isUpdate ? 'Update Base' : 'Create Base'}</h2>
              <p className="text-sm text-secondary">{isUpdate ? 'Update base details' : 'Add a new base to your workspace'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-[var(--text-color-tertiary)]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="baseName" className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              Base Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="baseName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter base name"
                className={`field-component field-component-border field-component-focus ${error || validationError ? 'border-red-500' : 'border-gray-300'}`}
                required
                minLength={3}
                maxLength={50}
                autoFocus
              />
              <div className="absolute right-5 top-1/2 h-5 w-4 transform -translate-y-1/2 z-50">
                <span className="relative inline-block group">
                  <HelpCircle className={`w-4 h-4 ${
                    validationError ? 'text-red-500' : name.trim().length >= 3 ? 'text-green-600' : 'text-gray-400'
                  } cursor-help`} />
                  <div className="invisible group-hover:visible absolute left-0 mt-1 w-64 bg-white border rounded-xl shadow-lg p-3 text-sm z-50">
                    <h4 className="font-medium mb-2">Base name requirements:</h4>
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
            value={description}
            onChange={value => setDescription(value)}
            placeholder="Enter base description"
            rows={5}
            isBorder={true}
          />

          {/* Image Upload Section */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text-color-tertiary)] mb-1">
              Image
            </label>
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
                      const input = document.getElementById('image-upload') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
                
                {/* Upload Area - Right Side */}
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex-1 relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
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
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <input
                  type="file"
                  id="image-upload"
                  accept="image/svg+xml,image/png,image/jpeg,image/jpg,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border hover:bg-gray-100 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || name.trim().length < 3}
              className="flex items-center gap-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"></div>
                  {isUpdate ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isUpdate ? 'Update' : 'Create Base'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 