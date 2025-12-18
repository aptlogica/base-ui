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
      
      // Only close if click is outside main ref, excluded refs, and functions modal
      if (!isInsideMain && !isInsideExcluded && !isInsideFunctionsModal) {
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