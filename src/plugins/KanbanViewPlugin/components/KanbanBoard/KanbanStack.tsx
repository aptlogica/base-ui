import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import { Plus, MoreHorizontal, GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import DeleteConfirmModal from '../../../../components/modals/DeleteConfirmModal';
import { KanbanStack as Stack, Row } from './types';
import { BaseColumn } from '../../../../types/column.types';
import KanbanCard from './KanbanCard';
import { formatCompactNumber } from '../../../../utils/helpers';
// FRONTEND PAGINATION: Using frontend pagination for per-stack card pagination
import { useFrontendPagination } from '../../../../hooks/useFrontendPagination';

// Type alias for compatibility
type Column = BaseColumn;

interface KanbanStackProps {
  stack: Stack;
  columns: Column[];
  fieldConfig?: Array<{ id: string; position: number; isHidden: boolean }>;
  groupCol?: Column | null; // The field used for grouping (should be excluded from card display)
  groupFieldTitle?: string;
  onCardMove?: (cardId: string, targetStackId: string, position: number) => void;
  onCardCreate?: (stackId: string) => void;
  onCardEdit?: (cardId: string) => void;
  onCardDelete?: (cardId: string) => void;
  onStackCollapse?: (stackId: string) => void;
  onStackEdit?: (oldName: string, newName: string) => void;
  onStackDragStart?: (stackId: string, index: number, e: React.DragEvent) => void;
  onStackDrop?: (stackId: string, e: React.DragEvent) => void;
    onStackDelete?: (stackId: string) => void;
    onDuplicate?: (cardId: string) => void;
  index?: number;
}

const KanbanStack = memo<KanbanStackProps>((props) => {
  const {
    stack,
    columns,
    fieldConfig,
    groupCol,
    onCardMove,
    onCardCreate,
    onCardEdit,
    onCardDelete,
    onStackCollapse,
    onStackEdit,
    onStackDragStart,
    onStackDrop,
    onStackDelete,
    onDuplicate,
    index,
    groupFieldTitle
  } = props;

  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const menuOwnerId = useRef(Symbol('kanban-stack-menu'));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stack.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const isUncategorized = stack.id === 'Uncategorized';
  const [dropIndicatorPosition, setDropIndicatorPosition] = useState<number | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  // Calculate visible cards and pagination BEFORE handleDrop callback (which uses these)
  // NOTE: stack.cards already contains only cards for THIS specific stack (filtered per stack in KanbanBoard)
  const totalCards = stack.cards.length;
  const visibleCards = stack.cards.filter(card => !card._meta.deleted_at);

  // FRONTEND PAGINATION: Paginate cards per stack (only when not collapsed)
  // This allows rendering only a portion of cards initially for better performance
  const {
    allLoadedData: paginatedCards,
    loadNextPage,
    hasMore,
    currentPage,
    totalPages,
  } = useFrontendPagination({
    data: visibleCards,
    pageSize: 30, // Same as GridView
    initialPage: 1,
  });

  // Only use pagination when stack is expanded (not collapsed)
  const cardsToRender = stack.isCollapsed ? visibleCards : paginatedCards;

  // Memoize highlight handlers
  const addHighlight = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.add('ring-2', 'ring-[var(--color-brand-300)]', 'bg-[var(--color-brand-50)]', 'dark:bg-[var(--color-brand-900)]');
  }, []);
  const removeHighlight = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.classList.remove('ring-2', 'ring-[var(--color-brand-300)]', 'bg-[var(--color-brand-50)]', 'dark:bg-[var(--color-brand-900)]');
  }, []);

  // Calculate drop position for visual indicator
  const calculateDropPosition = useCallback((e: React.DragEvent): number | null => {
    const cardId = e.dataTransfer.getData('cardId') || e.dataTransfer.getData('text/plain');
    const sourceStackId = e.dataTransfer.getData('sourceStackId') || '';
    
    // Store dragged card ID for filtering in render
    if (cardId) {
      setDraggedCardId(cardId);
    }

    if (!cardId || !cardsContainerRef.current) return null;

    const cardsContainer = cardsContainerRef.current;
    const mouseY = e.clientY;

    const cardElements = Array.from(cardsContainer.querySelectorAll('.kanban-card')).filter((el: any) => {
      // Filter out the dragged card if it's being dragged from this stack
      if (sourceStackId === stack.id) {
        const cardData = el.querySelector('[data-card-id]');
        return cardData?.getAttribute('data-card-id') !== cardId;
      }
      return true;
    }) as HTMLElement[];

    if (cardElements.length === 0) {
      return null; // Will show at bottom
    }

    // Find which card the mouse is over or between
    for (let i = 0; i < cardElements.length; i++) {
      const card = cardElements[i];
      const rect = card.getBoundingClientRect();
      const cardTop = rect.top;
      const cardBottom = rect.bottom;
      const cardMiddle = cardTop + (rect.height / 2);

      // If mouse is above the middle of this card, insert before it
      if (mouseY >= cardTop && mouseY < cardMiddle) {
        return i;
      }
      // If mouse is in the bottom half of this card, insert after it
      if (mouseY >= cardMiddle && mouseY <= cardBottom) {
        return i + 1;
      }
    }

    // If mouse is below all cards, append to end
    if (cardElements.length > 0) {
      const lastCard = cardElements[cardElements.length - 1];
      const lastRect = lastCard.getBoundingClientRect();
      if (mouseY > lastRect.bottom) {
        return cardElements.length;
      }
    }

    return null;
  }, [stack.id]);

  // Memoize drag handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try { e.dataTransfer.dropEffect = 'move'; } catch { }
    
    // Calculate and update drop indicator position
    const position = calculateDropPosition(e);
    setDropIndicatorPosition(position);
  }, [calculateDropPosition]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    addHighlight();
    // Get dragged card ID if available
    const cardId = e.dataTransfer.getData('cardId') || e.dataTransfer.getData('text/plain');
    if (cardId) {
      setDraggedCardId(cardId);
    }
    // Calculate initial drop position
    const position = calculateDropPosition(e);
    setDropIndicatorPosition(position);
  }, [addHighlight, calculateDropPosition]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      removeHighlight();
      setDropIndicatorPosition(null);
      setDraggedCardId(null);
    }
  }, [removeHighlight]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    removeHighlight();

    const cardId = e.dataTransfer.getData('cardId') || e.dataTransfer.getData('text/plain');
    const sourceStackId = e.dataTransfer.getData('sourceStackId') || '';
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex') || '0', 10);

    if (cardId && onCardMove) {
      // FRONTEND PAGINATION: Map drop position from paginated cards to full array
      // dropIndicatorPosition is relative to cardsToRender (paginated), but we need position in visibleCards (full)
      let targetPosition: number;
      if (dropIndicatorPosition === null) {
        // Append to end
        targetPosition = visibleCards.length;
      } else if (stack.isCollapsed) {
        // If collapsed, use position directly (no pagination)
        targetPosition = dropIndicatorPosition;
      } else {
        // Since paginatedCards is a prefix of visibleCards (slice from 0 to currentPage * pageSize),
        // positions in paginatedCards directly correspond to positions in visibleCards for loaded cards
        // If dropping at or before the last loaded card, use the position directly
        if (dropIndicatorPosition < paginatedCards.length) {
          targetPosition = dropIndicatorPosition;
        } else {
          // Dropping after the last loaded card - append to end of full array
          targetPosition = visibleCards.length;
        }
      }

      // Adjust position if moving within same stack
      if (sourceStackId === stack.id) {
        // If moving within the same stack, we need to account for the card being removed
        if (sourceIndex < targetPosition) {
          // Moving down: the target position needs to be adjusted because the card will be removed first
          targetPosition -= 1;
        }
        // If moving up (sourceIndex >= targetPosition), no adjustment needed
        // because the card removal doesn't affect positions before it
      }

      // Prevent duplicate: Don't call onCardMove if dropping in the same stack at the same position
      if (sourceStackId === stack.id && sourceIndex === targetPosition) {
        setDropIndicatorPosition(null);
        setDraggedCardId(null);
        return; // No change needed, exit early
      }

      // Clear indicators after using the position
      setDropIndicatorPosition(null);
      setDraggedCardId(null);

      onCardMove(cardId, stack.id, targetPosition);
    } else {
      // Clear indicators even if no move
      setDropIndicatorPosition(null);
      setDraggedCardId(null);
    }
  }, [onCardMove, removeHighlight, visibleCards, paginatedCards, stack.isCollapsed, stack.id, dropIndicatorPosition]);

  const handleContainerDrop = useCallback((e: React.DragEvent) => {
    handleDrop(e);
    onStackDrop?.(stack.id, e);
  }, [handleDrop, onStackDrop, stack.id]);

  const handleHeaderDragStart = useCallback((e: React.DragEvent) => {
    if (isUncategorized) return;
    onStackDragStart?.(stack.id, typeof index === 'number' ? index : 0, e);
  }, [isUncategorized, onStackDragStart, stack.id, index]);

  const handleHeaderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleHeaderDrop = (e: React.DragEvent) => {
    dragCounter.current = 0;
    removeHighlight();
    onStackDrop?.(stack.id, e);
  };

  const handleStackEditClick = () => {
    setShowMenu(false);
    setIsEditing(true);
    setEditValue(stack.name);
  };

  const handleEditSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== stack.name) {
      onStackEdit?.(stack.name, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(stack.name);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  const handleMenuMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMenuButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    setMenuPos({ x: rect.right, y: rect.bottom + 4 });
    window.dispatchEvent(new CustomEvent('kanban-menu-open', { detail: { source: menuOwnerId.current } }));
    setShowMenu(v => !v);
  };

  const handleCollapseClick = () => {
    onStackCollapse?.(stack.id);
    setShowMenu(false);
  };

  const handleDeleteStackClick = () => {
    setShowMenu(false);
    setConfirmOpen(true);
  };

  const handleNewRecordClick = () => {
    onCardCreate?.(stack.id);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
  };

  const confirmDelete = () => {
    setConfirmOpen(false);
    onStackDelete?.(stack.id);
  };

  const getCardDragStartHandler = (c: Row) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', c._meta.id);
    e.dataTransfer.setData('cardId', c._meta.id);
    e.dataTransfer.setData('sourceStackId', stack.id);
    e.dataTransfer.setData('sourceIndex', String(stack.cards.findIndex(card => card._meta.id === c._meta.id)));
    // Track dragged card for visual indicator
    setDraggedCardId(c._meta.id);
  };

  // Assign a color based on a hash of the stack name for consistent but random color
  const getOptionColor = (option: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-cyan-100 text-cyan-800',
      'bg-red-100 text-red-800'
    ];
    // Simple hash function based on string chars
    let hash = 0;
    for (let i = 0; i < option.length; i++) {
      hash = option.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIdx = Math.abs(hash) % colors.length;
    return colors[colorIdx];
  };

  // Close menu on outside click / ESC
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showMenu]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close when another menu opens elsewhere (cards or other stacks)
  useEffect(() => {
    const onOtherMenuOpen = (e: any) => {
      const src = e?.detail?.source;
      if (src !== menuOwnerId.current) setShowMenu(false);
    };
    window.addEventListener('kanban-menu-open', onOtherMenuOpen as EventListener);
    return () => window.removeEventListener('kanban-menu-open', onOtherMenuOpen as EventListener);
  }, []);

  return (
    <div
      ref={containerRef}
      data-stack-id={stack.id}
      className={`kanban-stack bg-[var(--color-bg-secondary-subtle)] rounded-xl w-full md:w-96 transition-all duration-200 ${stack.isCollapsed ? 'self-start' : ''} border border-primary relative overflow-hidden ${!stack.isCollapsed ? 'pb-12' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleContainerDrop}
    >
      {/* Stack Header */}
      <div className={`flex items-center justify-between border-b p-3 ${!isUncategorized ? 'cursor-grab' : 'cursor-default'}`}
        draggable={!isUncategorized}
        onDragStart={handleHeaderDragStart}
        onDragEnter={handleDragEnter}
        onDragOver={handleHeaderDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleHeaderDrop}
      >
        <div className="flex items-center gap-2">
          {!isUncategorized ? <GripVertical className='w-5 h-5 text-gray-500' /> : null}
          <div className="flex items-center gap-2 flex-1">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSave}
                onKeyDown={handleEditKeyDown}
                className="px-2 py-1 text-xs font-semibold border border-primary rounded bg-background text-primary outline-none focus:ring-1 focus:ring-blue-500 min-w-20"
              />
            ) : (
              <span
                style={{ backgroundColor: stack.color }}
                className="font-semibold text-black px-2 py-0.5 rounded text-xs border truncate max-w-32"
                title={stack.name}
              >
                {stack.name}
              </span>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {/* Record count - hide when editing to avoid overlap with input */}
          {!isEditing && (
            <span className="text-xs text-gray-500 font-medium">
              {formatCompactNumber(visibleCards.length)} card{visibleCards.length !== 1 ? 's' : ''}
              {!stack.isCollapsed && hasMore && ` (${formatCompactNumber(paginatedCards.length)} loaded)`}
            </span>
          )}
          
          <button
            onMouseDown={handleMenuMouseDown}
            onClick={handleMenuButtonClick}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <MoreHorizontal className="w-3 h-3" />
          </button>

          {showMenu && (
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: menuPos.y,
                left: menuPos.x,
                zIndex: 10000,
                minWidth: 180,
                background: 'var(--color-alpha-white)',
                borderRadius: 8,
                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
                padding: 5,
                overflow: 'hidden'
              }}
              className="select-none border p-2 space-y-1 animate-fade-in"
            >
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors text-sm"
                onClick={handleCollapseClick}
              >
                {stack.isCollapsed ? (
                  <><ChevronDown className="w-4 h-4" /> Expand stack</>
                ) : (
                  <><ChevronUp className="w-4 h-4" /> Collapse stack</>
                )}
              </button>
              {!isUncategorized && (
                <>
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors text-sm"
                    onClick={handleStackEditClick}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit stack
                  </button>
                  <div className="border-t my-1" />
                  <button
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
                    onClick={handleDeleteStackClick}
                  >
                    <Trash2 className="w-4 h-4" /> Delete stack
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stack Content */}
      {!stack.isCollapsed && (
        <div 
          className='p-4 max-h-[90%] overflow-y-auto'
          onScroll={(e) => {
            // FRONTEND PAGINATION: Infinite scroll - load more when near bottom
            const target = e.currentTarget;
            const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
            if (scrollBottom < 200 && hasMore && !stack.isCollapsed) {
              loadNextPage();
            }
          }}
        >
          {/* Empty State */}
          {stack.cards.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-xs font-medium mb-1">Empty stack</p>
              <p className="text-xs mb-3 text-gray-400">Looks like this stack does not have any records</p>
            </div>
          ) : (
            <>
              {/* Cards */}
              <div ref={cardsContainerRef} className="space-y-2 min-h-[80px] mb-2">
                {cardsToRender.map((card, index) => {
                  const isDraggedCard = draggedCardId === card._meta.id;
                  
                  return (
                    <React.Fragment key={card._meta.id}>
                      {/* Drop indicator line before this card */}
                      {dropIndicatorPosition === index && !isDraggedCard && (
                        <div className="h-1 bg-[var(--color-brand-600)] rounded-full -my-1 z-50 opacity-80" 
                          style={{ 
                            boxShadow: '0 0 12px rgba(59, 130, 246, 0.8)',
                            marginLeft: '-8px',
                            marginRight: '-8px'
                          }}
                        />
                      )}
                      <div
                        draggable
                        onDragStart={getCardDragStartHandler(card)}
                      >
                        <div data-card-id={card._meta.id}>
                          <KanbanCard
                            card={card}
                            columns={columns}
                            fieldConfig={fieldConfig}
                            groupCol={groupCol}
                            onEdit={onCardEdit}
                            onDelete={onCardDelete}
                            onDuplicate={onDuplicate}
                          />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {/* Drop indicator at the end */}
                {dropIndicatorPosition === cardsToRender.length && (
                  <div className="h-1 bg-[var(--color-brand-600)] rounded-full -my-1 z-50 opacity-80" 
                    style={{ 
                      boxShadow: '0 0 12px rgba(59, 130, 246, 0.8)',
                      marginLeft: '-8px',
                      marginRight: '-8px'
                    }}
                  />
                )}
              </div>
              
              {/* FRONTEND PAGINATION: Load more button (alternative to infinite scroll) */}
              {hasMore && (
                <div className="flex justify-center mt-2 mb-2">
                  <button
                    onClick={loadNextPage}
                    className="px-4 py-2 text-xs font-medium text-primary-brand hover:text-hover-primary-dark bg-[var(--color-bg-secondary-subtle)] hover:bg-[var(--color-bg-brand-primary)] rounded-xl transition-colors"
                  >
                    Load more ({formatCompactNumber(visibleCards.length - paginatedCards.length)} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* New record button - only show if onCardCreate is provided (user has permission) */}
      {onCardCreate && (
        <div className={`${stack.isCollapsed ? '' : 'absolute bottom-0 left-0'} w-full border-t border-primary`}>
          <button
            onClick={handleNewRecordClick}
            className="w-full inline-flex items-center justify-center gap-1 text-primary-brand hover:text-hover-primary-dark text-xs font-medium p-3"
          >
            <Plus className="w-3 h-3" />
            New record
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={confirmOpen}
        title="Delete Stack"
        message={stack.cards && stack.cards.length > 0 
          ? `This stack contains ${stack.cards.length} ${stack.cards.length === 1 ? 'card' : 'cards'}. Deleting this stack will:\n\n• Remove the "${stack.name}" option from the "${groupFieldTitle || 'Status'}" field\n• Move all ${stack.cards.length} ${stack.cards.length === 1 ? 'card' : 'cards'} to the Uncategorized stack\n\nThis action cannot be undone.`
          : `This action will remove the "${stack.name}" option from the "${groupFieldTitle || 'Status'}" field. This cannot be undone.`
        }
        onClose={closeConfirm}
        onConfirm={confirmDelete}
      />
    </div>
  );
});

KanbanStack.displayName = 'KanbanStack';

export default KanbanStack;