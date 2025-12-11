'use client';

import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose, onAccept }: PrivacyPolicyModalProps) {

  if (!isOpen) return null;

  return (
    <div className="bg-modal-backdrop" onClick={onClose}>
      <div className="bg-modal !p-0" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-primary">Privacy Policy</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-primary max-h-[60vh] overflow-y-auto">

          <div className="text-primary leading-relaxed">
            <p className="mb-4">
              This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">1. Information We Collect</h3>
            <p className="mb-4">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">2. How We Use Your Information</h3>
            <p className="mb-4">
              We use the collected data for various purposes including to provide and maintain our Service, to notify you about changes, to allow you to participate in interactive features, and to provide customer support.
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">3. Data Security</h3>
            <p className="mb-4">
              The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure.
            </p>

            <h3 className="text-lg font-semibold text-primary mt-6 mb-2">4. Contact Us</h3>
            <p className="mb-4">
              If you have any questions about this Privacy Policy, You can contact us at <span className="text-blue-600">support@serenibase.com</span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-primary flex-shrink-0">
          <button
            onClick={() => {
              onAccept?.();
              onClose();
            }}
            className="w-full py-3 btn-primary"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
