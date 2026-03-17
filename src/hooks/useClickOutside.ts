// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import { useEffect, useRef, RefObject } from 'react';

interface UseClickOutsideProps {
  isOpen: boolean;
  onClose: () => void;
  excludeRefs?: RefObject<HTMLElement | null>[];
}

export const useClickOutside = ({ isOpen, onClose, excludeRefs = [] }: UseClickOutsideProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside the main ref
      const isInsideMain = ref.current?.contains(target);
      
      // Check if click is inside any excluded refs
      const isInsideExcluded = excludeRefs.some(excludeRef => 
        excludeRef.current?.contains(target)
      );
      
      // Check if click is inside the all-functions-modal (rendered via portal)
      const isInsideFunctionsModal = (target as HTMLElement).closest?.('.all-functions-modal');
      
      // Check if click is inside any portal that originated from within this modal
      // This handles dropdowns and popups from components inside the modal
      let isInsideModalPortal = false;
      if (ref.current) {
        const modalRect = ref.current.getBoundingClientRect();
        const targetRect = (target as Element).getBoundingClientRect?.();
        
        // If the target has a bounding rect and the modal has a bounding rect,
        // check if the click is within a reasonable distance of the modal
        // This handles portals that are positioned relative to the modal
        if (targetRect && modalRect.width > 0 && modalRect.height > 0) {
          // Allow clicks within 50px of the modal boundaries to account for dropdowns
          const extendedRect = {
            left: modalRect.left - 50,
            right: modalRect.right + 50,
            top: modalRect.top - 50,
            bottom: modalRect.bottom + 50
          };
          
          isInsideModalPortal = 
            targetRect.left >= extendedRect.left &&
            targetRect.right <= extendedRect.right &&
            targetRect.top >= extendedRect.top &&
            targetRect.bottom <= extendedRect.bottom;
        }
      }
      
      // Only close if click is outside main ref, excluded refs, functions modal, and modal portals
      if (!isInsideMain && !isInsideExcluded && !isInsideFunctionsModal && !isInsideModalPortal) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, excludeRefs]);

  return ref;
}; 