'use client';

import React from 'react';
import { X } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function TermsAndConditionsModal({ isOpen, onClose, onAccept }: TermsAndConditionsModalProps) {

  if (!isOpen) return null;

  return (
    <div className="bg-modal-backdrop" onClick={onClose}>
      <div className="bg-modal !p-0" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-primary">Terms and Conditions</h2>
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
          <ol className="space-y-5 list-decimal list-inside">
            <li>
              <span className="font-medium text-gray-900">
                Lorem ipsum dolor sit amet consectetur. Tempor sed ut egestas nulla dolor turpis vulputate.
              </span>{' '}
              Pellentesque sit ornare varius interdum risus. Pulvinar consectetur gravida aenean a enim
              aliquet eu ante. Scelerisque proin tempor nisi massa. Lacus quis velit rutrum volutpat. Sed
              mauris suscipit posuere nulla hendrerit in ut. Semper pretium adipiscing habitasse orci. Sem
              tempus mattis felis at. Eget ultrices turpis in id dolor neque.
              <ul className="mt-2 ml-6 list-disc space-y-1">
                <li>Lorem ipsum in dignissim mattis..</li>
                <li>Lorem ipsum in dignissim mattis..</li>
              </ul>
            </li>

            <li>
              <span className="font-medium text-gray-900">
                Lorem ipsum dolor sit amet consectetur. Pretium ultrices purus ornare cras consequat egestas
                neque volutpat.
              </span>{' '}
              Semper erat sagittis senectus consectetur arcu nunc. Aenean ante dictumst netus ut neque
              habitasse adipiscing ornare risus. Diam neque a viverra porttitor aliquam faucibus a dui nunc.
            </li>

            <li>
              <span className="font-medium text-gray-900">
                Lorem ipsum dolor sit amet consectetur. Tempor sed ut egestas nulla dolor turpis vulputate.
              </span>{' '}
              Pellentesque sit ornare varius interdum risus. Pulvinar consectetur gravida aenean a enim
              aliquet eu ante. Scelerisque proin tempor nisi massa. Lacus quis velit rutrum volutpat. Sed
              mauris suscipit posuere nulla hendrerit in ut. Semper pretium adipiscing habitasse orci. Sem
              tempus mattis felis at. Eget ultrices turpis in id dolor neque.
            </li>

            <li>
              <span className="font-medium text-gray-900">
                Lorem ipsum dolor sit amet consectetur. Tempor sed ut egestas nulla dolor turpis vulputate.
              </span>{' '}
              Pellentesque sit ornare varius interdum risus. Pulvinar consectetur gravida aenean a enim
              aliquet eu ante. Scelerisque proin tempor nisi massa. Lacus quis velit rutrum volutpat. Sed
              mauris suscipit posuere nulla hendrerit in ut. Semper pretium adipiscing habitasse orci. Sem
              tempus mattis felis at. Eget ultrices turpis in id dolor neque.
              <ul className="mt-2 ml-6 list-disc space-y-1">
                <li>Lorem ipsum in dignissim mattis..</li>
                <li>Lorem ipsum in dignissim mattis..</li>
              </ul>
            </li>

            <li>
              <span className="font-medium text-gray-900">
                Lorem ipsum in dignissim mattis nibh quis eu fames lacinia cursus dignissim eget lorem est.
              </span>
            </li>

            <li>
              <span className="font-medium text-gray-900">
                Lorem ipsum in dignissim mattis nibh quis eu fames lacinia cursus dignissim eget lorem est.
              </span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={() => {
              onAccept?.();
              onClose();
            }}
            className="w-full py-3 btn-primary"
          >
            Accept & close
          </button>
        </div>
      </div>
    </div>
  );
}
