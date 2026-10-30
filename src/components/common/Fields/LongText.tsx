// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlignLeft, Maximize2, X, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Link2, ExternalLink, Trash2, Edit } from 'lucide-react';
import { sanitizeExternalUrl } from '../../../utils/urlSecurity';

type RichTextFormat = 'bold' | 'italic' | 'underline' | 'strikeThrough' | 'ul' | 'ol' | 'quote' | 'link';

// How each toolbar format is detected at the selection. Inline styles prefer the browser's
// command state, which also covers formatting toggled on at a collapsed caret before typing.
const FORMAT_CHECKS: { format: RichTextFormat; command?: string; tags: string[] }[] = [
  { format: 'bold', command: 'bold', tags: ['b', 'strong'] },
  { format: 'italic', command: 'italic', tags: ['i', 'em'] },
  { format: 'underline', command: 'underline', tags: ['u'] },
  { format: 'strikeThrough', command: 'strikeThrough', tags: ['s', 'strike', 'del'] },
  { format: 'ul', tags: ['ul'] },
  { format: 'ol', tags: ['ol'] },
  { format: 'quote', tags: ['blockquote'] },
  { format: 'link', tags: ['a'] },
];

// Returns null when the browser can't report the state, so callers fall back to inspecting tags
const queryCommandStateSafe = (command: string): boolean | null => {
  try {
    return typeof document.queryCommandState === 'function' ? document.queryCommandState(command) : null; //NOSONAR
  } catch {
    return null;
  }
};

interface LongTextProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isBorder?: boolean;
  className?: string;
  allowEdit?: boolean;
  readOnly?: boolean;
  helperText?: string;
  onModalOpen?: (modalRef: React.RefObject<HTMLDivElement | null>) => void;
  onModalClose?: () => void;
  // Render the rich text editor in place (3 rows tall) instead of a preview input + expand modal
  inline?: boolean;
  config?: {
    defaultValue?: string;
    maxLength?: number;
    placeholder?: string;
    richText?: boolean;
    hideMaximizeButton?: boolean;
    [key: string]: any;
  };
}

export const LongText: React.FC<LongTextProps> = ({
  label,
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  isBorder = false,
  className = "",
  allowEdit = true,
  readOnly = false,
  helperText,
  onModalOpen,
  onModalClose,
  inline = false,
  config = {}
}) => {
  const { placeholder: configPlaceholder = placeholder, richText: richTextConfig = false, hideMaximizeButton = false } = config;
  const richText = richTextConfig;
  // Last HTML emitted by the inline editor, so echoing it back through `value` doesn't reset the cursor
  const lastInlineValueRef = useRef<string | null>(null);
  const [localValue, setLocalValue] = useState(value || '');
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalValue, setModalValue] = useState(value || '');
  const richTextEditorRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
  const [linkPopupPosition, setLinkPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const [linkEditData, setLinkEditData] = useState<{ link: HTMLAnchorElement | null; text: string; url: string; isEditing: boolean }>({
    link: null,
    text: '',
    url: '',
    isEditing: false
  });
  const linkPopupRef = useRef<HTMLDivElement>(null);
  const savedLinkSelectionRef = useRef<Range | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<RichTextFormat>>(() => new Set());

  // Helper to strip HTML tags for length validation
  const stripHTML = (html: string): string => {
    if (!html) return '';
    try {
      let result = html;
      let previous;
      // Apply regex repeatedly until no more changes (prevents bypass attacks like <<script>script>)
      do {
        previous = result;
        result = result.replace(/<[^>]*>/g, ''); //NOSONAR
      } while (result !== previous);
      return result;
    } catch {
      return html;
    }
  };

  // Plain-text values (e.g. a default value) need their line breaks converted,
  // otherwise contentEditable collapses them into a single line
  const toEditorHtml = (val: string): string => {
    if (!val || /<[a-z][\s\S]*>/i.test(val)) return val;
    return val
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('\n', '<br>');
  };

  const sanitizeRichTextHtml = (html: string): string => {
    if (!html) return '';
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('script,style,iframe,object,embed').forEach(node => node.remove());
      doc.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const name = attr.name.toLowerCase();
          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
            return;
          }
          if (name === 'href') {
            const safeHref = sanitizeExternalUrl(attr.value);
            if (!safeHref) {
              el.removeAttribute(attr.name);
              return;
            }
            el.setAttribute('href', safeHref);
          }
        });
      });
      return doc.body.innerHTML;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    let displayValue = value ?? '';

    // For rich text, show plain text preview (strip HTML tags)
    if (richText && displayValue) {
      displayValue = stripHTML(displayValue);
    }

    setLocalValue(displayValue);
  }, [value, richText]);

  // Helper to ensure all links have title attributes and are properly configured
  const enhanceLinks = (container: HTMLElement) => {
    const links = container.querySelectorAll('a');
    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href) {
        const safeHref = sanitizeExternalUrl(href);
        if (!safeHref) {
          link.removeAttribute('href');
          link.removeAttribute('title');
          return;
        }
        link.setAttribute('href', safeHref);
        // Add title if missing (use href as title)
        if (!link.getAttribute('title')) {
          link.setAttribute('title', safeHref);
        }
        // Ensure target="_blank" for external links
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
        }
        // Add security attributes
        if (!link.getAttribute('rel')) {
          link.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
  };

  useEffect(() => {
    if (isModalOpen) {
      const currentValue = value || '';
      setModalValue(currentValue);

      // Initialize rich text editor content when modal opens
      if (richText && richTextEditorRef.current) {
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          if (richTextEditorRef.current) {
            const safeValue = sanitizeRichTextHtml(currentValue);
            // Only update if content is different to avoid cursor jumping
            const currentHTML = richTextEditorRef.current.innerHTML;
            if (currentHTML !== safeValue) {
              richTextEditorRef.current.innerHTML = safeValue;
              // Enhance all links after setting content
              enhanceLinks(richTextEditorRef.current);
            }
            // Focus the editor after a brief delay to ensure content is set
            setTimeout(() => {
              if (richTextEditorRef.current) {
                richTextEditorRef.current.focus();
                // Move cursor to end
                const range = document.createRange();
                const selection = globalThis.getSelection();
                range.selectNodeContents(richTextEditorRef.current);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }, 10);
          }
        });
      }
    }
  }, [isModalOpen, value, richText]);

  // Load the value into the inline editor, unless it is the value the editor just emitted
  useEffect(() => {
    if (!inline || !richTextEditorRef.current) return;
    const currentValue = value ?? '';
    if (currentValue === lastInlineValueRef.current) return;
    const safeValue = sanitizeRichTextHtml(toEditorHtml(currentValue));
    if (richTextEditorRef.current.innerHTML !== safeValue) {
      richTextEditorRef.current.innerHTML = safeValue;
      enhanceLinks(richTextEditorRef.current);
    }
    lastInlineValueRef.current = currentValue;
  }, [inline, value]);

  const validate = (val: string) => {
    // For rich text, validate the text content length (without HTML tags)
    const textContent = richText ? stripHTML(val) : val;

    if (required && !textContent.trim()) {
      return 'This field is required';
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    const validationError = validate(newValue);
    setError(validationError);
    if (!validationError) {
      onChange(newValue);
    }
  };

  const handleBlur = () => {
    const validationError = validate(localValue);
    if (validationError) {
      setError(validationError);
    }
  };

  // Modal handlers
  const openModal = () => {
    setIsModalOpen(true);
    // Reset link popup when opening main modal
    if (isLinkPopupOpen) {
      setIsLinkPopupOpen(false);
      setLinkEditData({ link: null, text: '', url: '', isEditing: false });
    }
  };

  // Notify parent when modal opens and ref is available
  useEffect(() => {
    if (isModalOpen && modalRef.current && onModalOpen) {
      onModalOpen(modalRef);
    }
  }, [isModalOpen, onModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    // Notify parent about modal closing
    onModalClose?.();
  };

  const handleSave = () => {
    // For rich text, get HTML content from the editor
    let finalValue = modalValue;
    if (richText && richTextEditorRef.current) {
      finalValue = sanitizeRichTextHtml(richTextEditorRef.current.innerHTML || '');
      // Normalize empty content
      if (finalValue === '<br>' || finalValue === '<br/>' || finalValue.trim() === '') {
        finalValue = '';
      }
    }

    // Validate and save changes
    const validationError = validate(finalValue);
    setError(validationError);
    if (!validationError && finalValue !== value) {
      onChange(finalValue);
      closeModal();
    }
  };

  const handleModalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const sanitizedValue = e.target.value;
    setModalValue(sanitizedValue);
  };

  // Rich text editor handlers
  const handleRichTextChange = () => {
    if (!richText || !richTextEditorRef.current) return;

    // Enhance links before getting content
    enhanceLinks(richTextEditorRef.current);

    let htmlContent = richTextEditorRef.current.innerHTML;
    // Normalize empty content (remove <br> tags that browsers add to empty contentEditable)
    if (htmlContent === '<br>' || htmlContent === '<br/>' || htmlContent.trim() === '') {
      htmlContent = '';
      // Don't set innerHTML here to avoid cursor jumping - just normalize the value
    }
    setModalValue(htmlContent);
    updateActiveFormats();

    // The inline editor has no Save step, so changes are emitted as they are typed
    if (inline) {
      const safeValue = htmlContent ? sanitizeRichTextHtml(htmlContent) : '';
      lastInlineValueRef.current = safeValue;
      if (error) setError(validate(safeValue));
      onChange(safeValue);
    }
  };

  const handleInlineBlur = () => {
    setError(validate(richTextEditorRef.current ? sanitizeRichTextHtml(richTextEditorRef.current.innerHTML) : ''));
  };

  // Plain (non rich text) inline editor
  const inlineTextValue = value ?? '';

  const handleInlineTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (error) setError(validate(newValue));
    onChange(newValue);
  };

  const isSelectionInsideTag = (tagName: string): boolean => {
    const selection = globalThis.getSelection();
    if (!selection || selection.rangeCount === 0 || !richTextEditorRef.current) return false;

    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;

    const normalizedTag = tagName.toUpperCase();
    while (node && node !== richTextEditorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === normalizedTag) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  };

  // Recomputes which toolbar formats apply at the current selection, so their buttons can be highlighted
  const updateActiveFormats = () => {
    const editor = richTextEditorRef.current;
    const selection = globalThis.getSelection();
    if (!editor || !selection || selection.rangeCount === 0 || !editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      setActiveFormats(prev => (prev.size === 0 ? prev : new Set()));
      return;
    }

    const next = new Set(
      FORMAT_CHECKS
        .filter(({ command, tags }) =>
          (command && queryCommandStateSafe(command)) ?? tags.some(tag => isSelectionInsideTag(tag))
        )
        .map(({ format }) => format)
    );

    setActiveFormats(prev =>
      prev.size === next.size && [...next].every(format => prev.has(format)) ? prev : next
    );
  };

  // Keep toolbar highlights in sync with the caret while an editor is on screen
  const updateActiveFormatsRef = useRef(updateActiveFormats);
  updateActiveFormatsRef.current = updateActiveFormats;
  const isEditorVisible = richText && !readOnly && (inline || isModalOpen);
  useEffect(() => {
    if (!isEditorVisible) return;
    const handleSelectionChange = () => updateActiveFormatsRef.current();
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [isEditorVisible]);

  const getClosestAncestorTag = (startNode: Node | null, tagName: string): HTMLElement | null => {
    if (!startNode || !richTextEditorRef.current) return null;

    let node: Node | null = startNode.nodeType === Node.TEXT_NODE ? startNode.parentNode : startNode;
    const normalizedTag = tagName.toUpperCase();

    while (node && node !== richTextEditorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === normalizedTag) {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }

    return null;
  };

  const unwrapBlockquoteAtSelection = (): boolean => {
    const selection = globalThis.getSelection();
    if (!selection || selection.rangeCount === 0 || !richTextEditorRef.current) return false;

    const range = selection.getRangeAt(0);
    const blockquote = getClosestAncestorTag(range.commonAncestorContainer, 'blockquote');
    if (!blockquote?.parentNode) return false;

    const parent = blockquote.parentNode;
    while (blockquote.firstChild) {
      parent.insertBefore(blockquote.firstChild, blockquote);
    }
    blockquote.remove();

    return true;
  };

  const wrapListWithBlockquoteAtSelection = (): boolean => {
    const selection = globalThis.getSelection();
    if (!richTextEditorRef.current) return false;

    const editor = richTextEditorRef.current;
    const getListAncestor = (node: Node | null): HTMLElement | null => {
      if (!node) return null;
      const unorderedList = getClosestAncestorTag(node, 'ul');
      const orderedList = getClosestAncestorTag(node, 'ol');
      return unorderedList || orderedList;
    };
    let list: HTMLElement | null = null;

    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      list = getListAncestor(range.commonAncestorContainer);

      // If selection is at editor/root level, resolve by cursor offset child.
      if (!list && range.startContainer === editor) {
        const childAtCursor = editor.childNodes[range.startOffset] ?? editor.childNodes[Math.max(0, range.startOffset - 1)] ?? null;
        list = getListAncestor(childAtCursor);
      }
    }

    // Selection may move off list after quote toggle; if editor has a single list, use it.
    if (!list) {
      const lists = Array.from(editor.querySelectorAll('ul, ol'));
      if (lists.length === 1) {
        list = lists[0] as HTMLElement;
      }
    }

    if (!list?.parentNode) return false;

    // Already quoted (directly or by an ancestor blockquote).
    if (getClosestAncestorTag(list, 'blockquote')) {
      return true;
    }

    const blockquote = document.createElement('blockquote');
    list.parentNode.insertBefore(blockquote, list);
    blockquote.appendChild(list);
    return true;
  };

  const execFormatBlockWithFallback = (values: string[]): boolean => {
    for (const formatValue of values) {
      // @ts-ignore - execCommand is deprecated but still needed for rich text formatting
      if (document.execCommand('formatBlock', false, formatValue)) return true; //NOSONAR
    }
    return false;
  };

  const execCommand = (command: string, value: string | null = null, event?: React.MouseEvent) => {
    // Only allow commands in rich text mode
    if (!richText || !richTextEditorRef.current) return;

    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Ensure editor has focus before executing command
    richTextEditorRef.current.focus();

    let success = false;
    // `formatBlock` for blockquote is inconsistent across browsers.
    if (command === 'formatBlock' && value?.toLowerCase() === 'blockquote') {
      if (isSelectionInsideTag('blockquote')) {
        // Toggle off quote by unwrapping first, so nested lists keep their structure.
        // Fallback to formatBlock only if unwrapping fails for any reason.
        success = unwrapBlockquoteAtSelection();
        if (!success) {
          success = execFormatBlockWithFallback(['p', '<p>', 'div', '<div>']);
        }
      } else {
        // Adding quote inside a list should preserve ul/ol/li structure.
        // Prefer manual list wrapping; fallback to formatBlock for non-list content.
        success = wrapListWithBlockquoteAtSelection();
        if (!success) {
          success = execFormatBlockWithFallback(['blockquote', '<blockquote>', 'BLOCKQUOTE']);
        }
      }
    } else {
      // Execute the command
      success = document.execCommand(command, false, value || undefined);  //NOSONAR
    }

    if (success) {
      // Update state after command execution
      setTimeout(() => {
        handleRichTextChange();
        // Restore focus
        if (richTextEditorRef.current) {
          richTextEditorRef.current.focus();
        }
      }, 0);
    }
  };

  const insertList = (type: 'ul' | 'ol', event: React.MouseEvent) => {
    execCommand(type === 'ul' ? 'insertUnorderedList' : 'insertOrderedList', null, event);
  };

  // Helper to normalize URL
  const normalizeUrl = (url: string): string => {
    const safeUrl = sanitizeExternalUrl(url);
    return safeUrl || '';
  };

  // Helper to find the link at current selection
  const getLinkAtSelection = (): HTMLAnchorElement | null => {
    if (!richTextEditorRef.current) return null;

    const selection = globalThis.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer;

    // If it's a text node, get the parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode as Node;
    }

    // Find the anchor element
    while (node && node !== richTextEditorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
        return node as HTMLAnchorElement;
      }
      node = node.parentNode as Node;
    }

    return null;
  };

  // Calculate popup position near the element
  const calculatePopupPosition = (element: HTMLElement | Range): { top: number; left: number } => {
    let rect: DOMRect;

    rect = element.getBoundingClientRect();

    const popupWidth = 320; // Approximate popup width
    const popupHeight = 120; // Approximate popup height
    const offset = 8;

    const viewportWidth = globalThis.innerWidth;
    const viewportHeight = globalThis.innerHeight;

    // Try to position below the element
    let top = rect.bottom + offset;
    let left = rect.left;

    // Adjust if popup would go off screen
    if (top + popupHeight > viewportHeight) {
      // Try above
      if (rect.top - popupHeight - offset > 0) {
        top = rect.top - popupHeight - offset;
      } else {
        // Center vertically if no space
        top = Math.max(8, (viewportHeight - popupHeight) / 2);
      }
    }

    // Adjust horizontal position
    if (left + popupWidth > viewportWidth) {
      left = viewportWidth - popupWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }

    return { top, left };
  };

  const insertLink = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Only allow links in rich text mode
    if (!richText || !richTextEditorRef.current) return;

    const selection = globalThis.getSelection();

    // Check if we're editing an existing link
    const existingLink = getLinkAtSelection();
    if (existingLink) {
      savedLinkSelectionRef.current = null;
      showLinkPopup(existingLink);
      return;
    }

    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const isSelectionInEditor = richTextEditorRef.current.contains(range.commonAncestorContainer);

    // Only open link popup for an explicit, non-collapsed selection inside the editor.
    if (!isSelectionInEditor || range.collapsed) {
      return;
    }

    savedLinkSelectionRef.current = range.cloneRange();

    // Create new link - show popup near selection
    const selectedText = range.toString().trim();
    const position = calculatePopupPosition(range);
    setLinkEditData({
      link: null,
      text: selectedText,
      url: '',
      isEditing: false
    });
    setLinkPopupPosition(position);
    setIsLinkPopupOpen(true);
  };

  const showLinkPopup = (link: HTMLAnchorElement) => {
    if (!richTextEditorRef.current || !link) return;

    const currentUrl = link.getAttribute('href') || '';
    const currentText = link.textContent || '';

    // Remove protocol for display/edit
    const displayUrl = currentUrl.replace(/^https?:\/\//i, '');

    const position = calculatePopupPosition(link);

    setLinkEditData({
      link,
      text: currentText,
      url: displayUrl,
      isEditing: false
    });
    setLinkPopupPosition(position);
    setIsLinkPopupOpen(true);
  };

  const editLink = () => {
    setLinkEditData({ ...linkEditData, isEditing: true });
  };

  const handleLinkSave = () => { //NOSONAR
    const { link, text, url } = linkEditData;

    if (!url.trim()) {
      // No URL provided - just close popup
      setIsLinkPopupOpen(false);
      setLinkEditData({ link: null, text: '', url: '', isEditing: false });
      savedLinkSelectionRef.current = null;
      return;
    }

    const normalizedUrl = normalizeUrl(url);
    
    // Additional security: Validate URL protocol to prevent XSS via javascript: URLs
    let trustedUrl: string | null = null;
    if (normalizedUrl) {
      try {
        const urlObj = new globalThis.URL(normalizedUrl);
        // Only allow http/https protocols and create a clean URL to break taint chain
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
          trustedUrl = urlObj.toString();
        }
      } catch {
        // Invalid URL, keep trustedUrl as null
      }
    }
    
    if (!trustedUrl) {
      setIsLinkPopupOpen(false);
      setLinkEditData({ link: null, text: '', url: '', isEditing: false });
      savedLinkSelectionRef.current = null;
      return;
    }

    if (link) {
      // Editing existing link
      link.setAttribute('href', trustedUrl);
      link.setAttribute('title', trustedUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      // Update link text if changed
      if (text.trim() && text !== link.textContent) {
        link.textContent = text;
      }

      setLinkEditData({ ...linkEditData, isEditing: false });
    } else {
      // Creating new link
      if (!richTextEditorRef.current) return;

      const selection = globalThis.getSelection();
      const savedRange = savedLinkSelectionRef.current;
      if (!selection || !savedRange) return;

      richTextEditorRef.current.focus();
      selection.removeAllRanges();
      selection.addRange(savedRange);

      // If text is provided, use it; otherwise use selected text
      const linkText = text.trim() || savedRange.toString().trim() || trustedUrl;

      // Create the link
      execCommand('createLink', trustedUrl);

      // Find and enhance the newly created link
      setTimeout(() => {
        const targetLink = getLinkAtSelection();
        if (targetLink) {
          targetLink.setAttribute('title', trustedUrl);
          targetLink.setAttribute('target', '_blank');
          targetLink.setAttribute('rel', 'noopener noreferrer');

          // Update link text if different from selected text
          if (linkText && linkText !== targetLink.textContent) {
            targetLink.textContent = linkText;
          }

          handleRichTextChange();
        }
      }, 50);

      setIsLinkPopupOpen(false);
      setLinkEditData({ link: null, text: '', url: '', isEditing: false });
      savedLinkSelectionRef.current = null;
    }

    handleRichTextChange();
  };

  const handleLinkCancel = () => {
    setIsLinkPopupOpen(false);
    setLinkEditData({ link: null, text: '', url: '', isEditing: false });
    savedLinkSelectionRef.current = null;
  };

  const handleLinkRemove = () => {
    const { link, text } = linkEditData;
    if (!link) return;

    // Remove link, keep text
    const currentText = link.textContent || text;
    const textNode = document.createTextNode(currentText);
    link.parentNode?.replaceChild(textNode, link);
    handleRichTextChange();

    setIsLinkPopupOpen(false);
    setLinkEditData({ link: null, text: '', url: '', isEditing: false });
    savedLinkSelectionRef.current = null;
  };

  const handleLinkOpen = () => {
    const { link } = linkEditData;
    if (!link) return;

    const href = link.getAttribute('href');
    const safeHref = href ? sanitizeExternalUrl(href) : null;
    if (safeHref) {
      globalThis.open(safeHref, '_blank', 'noopener,noreferrer');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (!richText || !richTextEditorRef.current) return;

    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text); //NOSONAR
    handleRichTextChange();
  };

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isLinkPopupOpen &&
        linkPopupRef.current &&
        !linkPopupRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement)?.closest('a')
      ) {
        setIsLinkPopupOpen(false);
        setLinkEditData({ link: null, text: '', url: '', isEditing: false });
        savedLinkSelectionRef.current = null;
      }
    };

    if (isLinkPopupOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isLinkPopupOpen]);

  const getToolbarButtonProps = (format: RichTextFormat) => {
    const isActive = activeFormats.has(format);
    return {
      'aria-pressed': isActive,
      className: `p-1.5 rounded transition-colors ${isActive
        ? 'bg-[var(--color-brand-100)] text-[var(--color-brand-700)] hover:bg-[var(--color-brand-200)]'
        : 'text-primary hover:bg-gray-200'}`,
    };
  };

  const toolbarButtons = (
    <>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); execCommand('bold', null, e); }}
        {...getToolbarButtonProps('bold')}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); execCommand('italic', null, e); }}
        {...getToolbarButtonProps('italic')}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); execCommand('underline', null, e); }}
        {...getToolbarButtonProps('underline')}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); execCommand('strikeThrough', null, e); }}
        {...getToolbarButtonProps('strikeThrough')}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); insertList('ul', e); }}
        {...getToolbarButtonProps('ul')}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); insertList('ol', e); }}
        {...getToolbarButtonProps('ol')}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1" />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', 'blockquote', e); }}
        {...getToolbarButtonProps('quote')}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onMouseDown={insertLink}
        {...getToolbarButtonProps('link')}
        title="Link"
        disabled={!richText}
      >
        <Link2 className="w-4 h-4" />
      </button>
    </>
  );

  const renderRichTextEditor = (editorClassName: string) => (
    <div //NOSONAR
      ref={richTextEditorRef}
      contentEditable={!readOnly}
      suppressContentEditableWarning
      onInput={readOnly ? undefined : handleRichTextChange}
      onPaste={readOnly ? undefined : handlePaste}
      onBlur={inline ? handleInlineBlur : undefined}
      onKeyDown={(e) => {
        e.stopPropagation();
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
          if (e.key === 'b') {
            e.preventDefault();
            execCommand('bold', null, e as any);
          } else if (e.key === 'i') {
            e.preventDefault();
            execCommand('italic', null, e as any);
          } else if (e.key === 'u') {
            e.preventDefault();
            execCommand('underline', null, e as any);
          }
        }
      }}
      onClick={(e) => {
        // Make links clickable (only in rich text mode)
        if (!richText) return;

        const target = e.target as HTMLElement;
        if (target.tagName === 'A' && target instanceof HTMLAnchorElement) {
          const href = target.getAttribute('href');
          if (href) {
            // Ctrl/Cmd+Click - let browser handle (opens in new tab)
            if (e.ctrlKey || e.metaKey) {
              return; // Let browser handle it
            }
            // Regular click - show popup
            e.preventDefault();
            e.stopPropagation();
            showLinkPopup(target);
          }
        }
      }}
      className={editorClassName}
      style={{
        outline: 'none'
      }}
      data-placeholder={(inline ? configPlaceholder : placeholder) || 'Start typing...'}
    />
  );

  const richTextStyles = (
    <style>{`
      [contenteditable][data-placeholder]:empty:before {
        content: attr(data-placeholder);
        color: var(--color-gray-400);
        pointer-events: none;
      }
      [contenteditable][data-placeholder]:focus:empty:before {
        content: attr(data-placeholder);
        color: var(--color-gray-400);
        pointer-events: none;
      }
      [contenteditable] a {
        color: #2563eb;
        text-decoration: underline;
        cursor: pointer;
      }
      [contenteditable] a:hover {
        color: #1d4ed8;
        text-decoration: underline;
      }
      [contenteditable] a:visited {
        color: #7c3aed;
      }
      [contenteditable] ul {
        list-style-type: disc;
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      [contenteditable] ol {
        list-style-type: decimal;
        margin: 0.5rem 0;
        padding-left: 1.5rem;
      }
      [contenteditable] li {
        margin: 0.25rem 0;
      }
      [contenteditable] blockquote {
        border-left: 3px solid var(--color-border-secondary);
        margin: 0.5rem 0;
        padding: 0.25rem 0 0.25rem 0.75rem;
        color: var(--color-text-secondary);
      }
    `}</style>
  );

  return (
    <div className="w-full">

      {label && (
        <label className="field-component-label">
          {label}
          {required && <span className="field-component-required">*</span>}
        </label>
      )}

      {inline && !richText ? (
        <textarea
          value={inlineTextValue}
          onChange={handleInlineTextChange}
          onBlur={(e) => setError(validate(e.target.value))}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder={configPlaceholder || 'Start typing...'}
          readOnly={readOnly}
          disabled={disabled}
          rows={3}
          className={`w-full field-component-border bg-[--color-alpha-white] px-3 py-2 text-xs leading-5 [overflow-wrap:anywhere] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-600)] transition-colors resize-y ${readOnly ? 'cursor-default' : 'cursor-text'} ${error ? 'border-red-500' : ''} ${className}`}
        />
      ) : inline ? (
        <div className={`w-full min-w-0 field-component-border bg-[--color-alpha-white] overflow-hidden transition-colors focus-within:border-[var(--color-brand-600)] ${error ? 'border-red-500' : ''} ${className}`}>
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b">
              {toolbarButtons}
            </div>
          )}
          {/* 3 rows of text: 3 x 1.25rem line height + 1rem vertical padding */}
          {renderRichTextEditor(`w-full h-[4.75rem] min-h-[4.75rem] px-3 py-2 text-xs leading-5 [overflow-wrap:anywhere] text-[var(--color-text-primary)] overflow-y-auto resize-y ${readOnly ? 'cursor-default' : 'cursor-text'}`)}
          {richTextStyles}
        </div>
      ) : (
        <div className={`relative flex items-center ${className} ${isBorder ? "field-component-border" : ""}`}>
          <input
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={configPlaceholder}
            disabled={false}
            className={`field-component ${error ? 'border-red-500 bg-red-50' : ''
              } ${disabled || readOnly ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'} truncate`}
            readOnly
            style={readOnly ? { cursor: 'default' } : { cursor: 'pointer' }}
            onDoubleClick={readOnly ? undefined : openModal}
          />
          {!readOnly && !hideMaximizeButton && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openModal(); }}
              className="mx-2 w-8 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-colors z-0"
              tabIndex={-1}
              disabled={disabled}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
          {readOnly && !hideMaximizeButton && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openModal(); }}
              className="mx-2 w-8 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-colors z-0"
              tabIndex={-1}
              disabled={false}
              title="View full content"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}


      {/* Error*/}
      {error && allowEdit && (
        <div className="mt-1.5 text-red-500 cursor-default">
          {error}
        </div>
      )}

      {/* Helper Text */}
      {helperText && allowEdit && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}

      {/* Custom Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onContextMenu={(e) => e.preventDefault()}> {/* NOSONAR */}
          {/* Backdrop */}
          <div className="absolute inset-0 backdrop-blur-sm bg-opacity-40" onClick={closeModal} /> {/* NOSONAR */}
          {/* Modal Content */}
          <div ref={modalRef} className="relative bg-[var(--color-card)] border rounded-xl shadow-xl w-full max-w-5xl h-[85vh] p-6 flex flex-col z-10 overflow-hidden">
            <div className="flex items-center mb-4 flex-shrink-0">
              <AlignLeft className="w-8 h-8 rounded icon-primary p-1 mr-2" />
              <span className="text-lg font-medium text-secondary">Long Text</span>
              {richText && !readOnly && (
                <div className="flex items-center gap-1 ml-4 px-2 py-1 bg-gray-100 rounded-xl">
                  {toolbarButtons}
                </div>
              )}
              <button
                type="button"
                onClick={closeModal}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
                aria-label="Close"
              >
                <X className="w-5 h-5 mr-3" />
              </button>
            </div>
            {richText ? (
              <div className="w-full flex-1 flex flex-col min-h-0">
                {renderRichTextEditor("w-full flex-1 min-h-0 [overflow-wrap:anywhere] bg-[var(--background)] border rounded-xl p-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-600)] transition-all overflow-y-auto")}
                {richTextStyles}
              </div>
            ) : (
              <textarea
                value={modalValue}
                onChange={handleModalChange}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full flex-1 min-h-0 bg-[var(--background)] border rounded-xl p-3 text-sm text-secondary focus:outline-none focus:border-[var(--color-brand-600)] transition-all resize-vertical"
                placeholder={placeholder}
                disabled={disabled || readOnly}
              />
            )}
            <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
              <button
                type='button'
                onClick={closeModal}
                className="px-16 py-2 rounded-xl border bg-card hover:bg-gray-50 focus:ring-1 focus:ring-gray-500 transition-all disabled:opacity-50 text-gray-700"
              >
                Close
              </button>
              {!readOnly && (
                <button
                  type='button'
                  onClick={handleSave}
                  className="px-16 py-2 text-sm font-medium btn-primary transition-colors"
                >
                  Save
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Link Popup - Floating near link/selection */}
      {isLinkPopupOpen && linkPopupPosition && createPortal(
        <>
          {/* Backdrop to close on outside click */}
          <div //NOSONAR
            className="fixed inset-0 z-[9999]"
            onClick={handleLinkCancel}
            style={{ background: 'transparent' }}
          />
          {/* Popup */}
          <div //NOSONAR
            ref={linkPopupRef}
            className="fixed z-[10000] bg-card border rounded-xl shadow-xl p-3 min-w-[280px] max-w-[400px]"
            style={{
              top: `${linkPopupPosition.top}px`,
              left: `${linkPopupPosition.left}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {linkEditData.isEditing || !linkEditData.link ? (
              // Edit mode or creating new link
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={linkEditData.text}
                    onChange={(e) => setLinkEditData({ ...linkEditData, text: e.target.value })}
                    className="w-full bg-[--color-alpha-white] text-[var(--color-text-primary)] px-2 py-1.5 border rounded-xl text-sm focus:outline-none focus:border-[var(--color-brand-600)]"
                    placeholder="Link text"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        (e.target as HTMLInputElement).nextElementSibling?.querySelector('input')?.focus();
                      } else if (e.key === 'Escape') {
                        handleLinkCancel();
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={linkEditData.url}
                    onChange={(e) => setLinkEditData({ ...linkEditData, url: e.target.value.trim() })}
                    className="flex-1 bg-[--color-alpha-white] text-[var(--color-text-primary)] px-2 py-1.5 border rounded-xl text-sm focus:outline-none focus:border-[var(--color-brand-600)]"
                    placeholder="https://example.com"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLinkSave();
                      } else if (e.key === 'Escape') {
                        handleLinkCancel();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleLinkSave}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition-colors"
                  >
                    {linkEditData.link ? 'Save' : 'Insert'}
                  </button>
                </div>
              </div>
            ) : (
              // View mode for existing link
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 break-all">
                  <span className="truncate" title={linkEditData.link?.getAttribute('href') || ''}>
                    {linkEditData.link?.getAttribute('href') || linkEditData.url}
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={handleLinkOpen}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={editLink}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    title="Edit link"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkRemove}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors ml-auto"
                    title="Remove link"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
};
