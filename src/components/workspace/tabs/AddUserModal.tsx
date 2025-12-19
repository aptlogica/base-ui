import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAddTenantUser } from '../../../hooks/useApi';
import { useToast } from '../../common/Toast';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { mutate: addUser, isPending } = useAddTenantUser();
  const toast = useToast();

  // Enhanced email validation regex
  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(emailValue.trim());
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Validate first name - only alphabetic characters and spaces
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(firstName.trim())) {
      newErrors.firstName = 'First name must contain only letters and spaces';
    }
    
    // Validate last name - only alphabetic characters and spaces
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(lastName.trim())) {
      newErrors.lastName = 'Last name must contain only letters and spaces';
    }
    
    // Validate email with enhanced validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time email validation on blur
  const handleEmailBlur = () => {
    if (email.trim()) {
      if (!validateEmail(email)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.email;
          return newErrors;
        });
      }
    }
  };

  // Clear email error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const payload = {
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        email: email.trim()
      };
      
      addUser(
        payload,
        {
          onSuccess: () => {
            toast.success(`User ${firstName} ${lastName} added successfully`);
            setFirstName('');
            setLastName('');
            setEmail('');
            setErrors({});
            onClose();
          },
          onError: (error: any) => {
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to add user';
            toast.error(errorMsg);
          }
        }
      );
    }
  };

  if (!isOpen) return null;

  // Check if form is valid - all fields filled, no errors, and email is valid
  const isEmailValid = email.trim() ? validateEmail(email) : false;
  const isValid = firstName.trim() && lastName.trim() && email.trim() && isEmailValid && Object.keys(errors).length === 0;

  return (
    <div className="bg-modal-backdrop" onClick={onClose}>
      <div className="bg-modal !max-w-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                // Clear error when user starts typing
                if (errors.firstName) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.firstName;
                    return newErrors;
                  });
                }
              }}
              placeholder="Enter first name"
              className={`w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                // Clear error when user starts typing
                if (errors.lastName) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.lastName;
                    return newErrors;
                  });
                }
              }}
              placeholder="Enter last name"
              className={`w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="Enter email address"
              className={`w-full text-xs px-3 h-11 border flex items-center rounded-[var(--radius-lg)] text-[var(--color-text-primary)] focus:border-[--color-brand-600] placeholder:text-[var(--color-text-placeholder)] bg-[--color-alpha-white] truncate overflow-ellipsis whitespace-nowrap outline-none cursor-pointer transition-all duration-200 ${
                errors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={isPending}
            className={`px-4 py-2 rounded-xl border hover:bg-gray-50 transition-all ${isPending ? 'btn-disabled' : ''}`}
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(e as any);
            }}
            disabled={!isValid || isPending}
            className="px-4 py-2 btn-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Adding...' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  );
};
