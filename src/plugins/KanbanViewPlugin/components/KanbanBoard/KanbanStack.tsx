import React, { memo, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Plus, MoreHorizontal, GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import DeleteConfirmModal from '../../../../components/modals/DeleteConfirmModal';
import { KanbanStack as Stack, Row } from './types';
import { BaseColumn } from '../../../../types/column.types';
import KanbanCard from './KanbanCard';
import { formatCompactNumber } from '../../../../utils/helpers';
import { useFrontendPagination } from '../../../../hooks/useFrontendPagination';
import { GridColumn } from '../../../GridViewPlugin/types/grid.types';
import { normalizeFieldType } from '../../../../utils/fieldType';

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
  index?: number;
}

type StackHeaderProps = {
  className: string;
  dragProps: Record<string, unknown>;
  showGrip: boolean;
  titleNode: React.ReactNode;
  countNode: React.ReactNode;
  onMenuMouseDown: (e: React.MouseEvent) => void;
  onMenuClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuNode: React.ReactNode;
};

const StackHeader = memo<StackHeaderProps>((props) => {
  const {
    className,
    dragProps,
    showGrip,
    titleNode,
    countNode,
    onMenuMouseDown,
    onMenuClick,
    menuNode,
  } = props;

  return (
    <div className={className} {...dragProps}>
      <div className="flex items-center gap-2">
        {showGrip ? <GripVertical className='w-5 h-5 text-gray-500' /> : null}
        <div className="flex items-center gap-2 flex-1">
          {titleNode}
        </div>
      </div>

      <div className="relative flex items-center gap-2">
        {countNode}

        <button
          onMouseDown={onMenuMouseDown}
          onClick={onMenuClick}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
        >
          <MoreHorizontal className="w-3 h-3" />
        </button>

        {menuNode}
      </div>
    </div>
  );
});

StackHeader.displayName = 'StackHeader';

const getHeaderConfig = (
  stackName: string,
  isUncategorized: boolean,
  onStackDragStart?: (stackId: string, index: number, e: React.DragEvent) => void,
  handlers?: {
    onDragStart: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  }
) => {
  const canDragHeader = !isUncategorized && onStackDragStart !== undefined;
  const className = `flex items-center justify-between border-b p-3 ${canDragHeader ? 'cursor-grab' : 'cursor-default'}`;

  if (!canDragHeader || !handlers) {
    return {
      canDragHeader,
      className,
      dragProps: {
        role: undefined,
        'aria-label': undefined,
        tabIndex: undefined,
        draggable: false,
      } as Record<string, unknown>,
    };
  }

  return {
    canDragHeader,
    className,
    dragProps: {
      role: 'button',
      'aria-label': `Drag ${stackName} stack to reorder`,
      tabIndex: 0,
      draggable: true,
      onDragStart: handlers.onDragStart,
      onDragEnter: handlers.onDragEnter,
      onDragOver: handlers.onDragOver,
      onDragLeave: handlers.onDragLeave,
      onDrop: handlers.onDrop,
      onKeyDown: handlers.onKeyDown,
    } as Record<string, unknown>,
  };
};

const dropIndicatorStyle = {
  boxShadow: '0 0 12px rgba(59, 130, 246, 0.8)',
  marginLeft: '-8px',
  marginRight: '-8px'
};

const buildDeleteMessage = (stack: Stack, fieldTitle = 'Status') => {
  const hasCards = stack.cards && stack.cards.length > 0;
  const cardCount = stack.cards?.length || 0;
  const cardWord = cardCount === 1 ? 'card' : 'cards';

  return hasCards
    ? `This stack contains ${cardCount} ${cardWord}. Deleting this stack will:\n\n• Remove the "${stack.name}" option from the "${fieldTitle}" field\n• Move all ${cardCount} ${cardWord} to the Uncategorized stack\n\nThis action cannot be undone.`
    : `This action will remove the "${stack.name}" option from the "${fieldTitle}" field. This cannot be undone.`;
};

const getDragData = (e: React.DragEvent) => {
  const cardId = e.dataTransfer.getData('cardId') || e.dataTransfer.getData('text/plain');
  const sourceStackId = e.dataTransfer.getData('sourceStackId') || '';
  const sourceIndex = Number.parseInt(e.dataTransfer.getData('sourceIndex') || '0', 10);
  return { cardId, sourceStackId, sourceIndex };
};

const filterCardElements = (
  cardsContainer: HTMLDivElement,
  sourceStackId: string,
  stackId: string,
  cardId: string
) => {
  const cardElements = Array.from(cardsContainer.querySelectorAll('.kanban-card'))
    .filter((el): el is HTMLElement => el instanceof HTMLElement);
  if (sourceStackId !== stackId) return cardElements;
  return cardElements.filter((el) => {
    const cardData = el.querySelector('[data-card-id]') as HTMLElement | null; //NOSONAR
    return cardData?.dataset.cardId !== cardId;
  });
};

const getDropPositionFromElements = (cardElements: HTMLElement[], mouseY: number) => {
  if (cardElements.length === 0) return null;

  for (let i = 0; i < cardElements.length; i++) {
    const card = cardElements[i];
    const rect = card.getBoundingClientRect();
    const cardTop = rect.top;
    const cardBottom = rect.bottom;
    const cardMiddle = cardTop + (rect.height / 2);

    if (mouseY >= cardTop && mouseY < cardMiddle) {
      return i;
    }
    if (mouseY >= cardMiddle && mouseY <= cardBottom) {
      return i + 1;
    }
  }

  const lastCard = cardElements.at(-1);
  const lastRect = lastCard?.getBoundingClientRect();
  if (lastRect && mouseY > lastRect.bottom) {
    return cardElements.length;
  }

  return null;
};

const KanbanStack = memo<KanbanStackProps>((props) => {
  const {
    stack,
    columns,
    fieldConfig,
    groupCol,
    onCardMove,
    onCardCreate,
    onCardEdit,
    onStackCollapse,
    onStackEdit,
    onStackDragStart,
    onStackDrop,
    onStackDelete,
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

  // Convert BaseColumn[] to GridColumn[] for KanbanCard
  const gridColumns = useMemo((): GridColumn[] => {
    return columns.map((col): GridColumn => ({
      ...col,
      type: normalizeFieldType(col.type || col.uidt || 'text') as any,
    }));
  }, [columns]);

  // Convert groupCol to GridColumn if it exists
  const gridGroupCol = useMemo((): GridColumn | null => {
    if (!groupCol) return null;
    return {
      ...groupCol,
      type: normalizeFieldType(groupCol.type || groupCol.uidt || 'text') as any,
    };
  }, [groupCol]);

  // NOTE: stack.cards already contains only cards for THIS specific stack (filtered per stack in KanbanBoard)
  const visibleCards = stack.cards.filter(card => !card._meta.deleted_at);

  // This allows rendering only a portion of cards initially for better performance
  const {
    allLoadedData: paginatedCards,
    loadNextPage,
    hasMore,
  } = useFrontendPagination({
    data: visibleCards,
    pageSize: 30,
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
    const { cardId, sourceStackId } = getDragData(e);

    if (cardId) {
      setDraggedCardId(cardId);
    }

    if (!cardId || !cardsContainerRef.current) return null;

    const cardsContainer = cardsContainerRef.current;
    const cardElements = filterCardElements(cardsContainer, sourceStackId, stack.id, cardId);

    return getDropPositionFromElements(cardElements, e.clientY);
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

  const resetDragState = () => {
    setDropIndicatorPosition(null);
    setDraggedCardId(null);
  };

  const calculateTargetPosition = (
    dropIndicatorPosition: number | null,
    visibleLength: number,
    paginatedLength: number,
    isCollapsed: boolean
  ): number => {
    if (dropIndicatorPosition === null) {
      return visibleLength;
    }

    if (isCollapsed) {
      return dropIndicatorPosition;
    }

    if (dropIndicatorPosition < paginatedLength) {
      return dropIndicatorPosition;
    }

    return visibleLength;
  };


  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      removeHighlight();

      const { cardId, sourceStackId, sourceIndex } = getDragData(e);

      // Original guard: only proceed if cardId && onCardMove
      if (!cardId || !onCardMove) {
        resetDragState();
        return;
      }

      let targetPosition = calculateTargetPosition(
        dropIndicatorPosition,
        visibleCards.length,
        paginatedCards.length,
        stack.isCollapsed
      );

      // Same-stack adjustment (unchanged)
      if (sourceStackId === stack.id && sourceIndex < targetPosition) {
        targetPosition -= 1;
      }

      // Prevent duplicate move (unchanged)
      if (sourceStackId === stack.id && sourceIndex === targetPosition) {
        resetDragState();
        return;
      }

      // Cleanup before move (same timing as original)
      resetDragState();
      onCardMove(cardId, stack.id, targetPosition);
    },
    [
      onCardMove,
      removeHighlight,
      visibleCards.length,
      paginatedCards.length,
      stack.isCollapsed,
      stack.id,
      dropIndicatorPosition,
    ]
  );

  const handleContainerDrop = useCallback((e: React.DragEvent) => {
    handleDrop(e);
    onStackDrop?.(stack.id, e);
  }, [handleDrop, onStackDrop, stack.id]);

  const handleHeaderDragStart = useCallback((e: React.DragEvent) => {
    if (isUncategorized) return;
    onStackDragStart?.(stack.id, typeof index === 'number' ? index : 0, e);
  }, [isUncategorized, onStackDragStart, stack.id, index]);

  const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  }, []);

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  }, []);

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

  const handleEditSave = async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== stack.name) {
      // Call the edit handler
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
    globalThis.dispatchEvent(new CustomEvent('kanban-menu-open', { detail: { source: menuOwnerId.current } }));
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

  const handleCardsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (scrollBottom < 200 && hasMore && !stack.isCollapsed) {
      loadNextPage();
    }
  }, [hasMore, loadNextPage, stack.isCollapsed]);

  const renderMenu = () => {
    if (!showMenu) return null;

    return (
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
            {onStackEdit && (
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-[var(--color-text-primary)] rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors text-sm"
                onClick={handleStackEditClick}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit stack
              </button>
            )}
            {onStackEdit && onStackDelete && <div className="border-t my-1" />}
            {onStackDelete && (
              <button
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 rounded-xl hover:bg-red-400 hover:text-black focus:bg-[var(--color-bg-brand-secondary)] transition-colors"
                onClick={handleDeleteStackClick}
              >
                <Trash2 className="w-4 h-4" /> Delete stack
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  const headerConfig = getHeaderConfig(
    stack.name,
    isUncategorized,
    onStackDragStart,
    {
      onDragStart: handleHeaderDragStart,
      onDragEnter: handleDragEnter,
      onDragOver: handleHeaderDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleHeaderDrop,
      onKeyDown: handleHeaderKeyDown,
    }
  );

  const renderStackTitle = () => {
    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSave}
          onKeyDown={handleEditKeyDown}
          className="px-2 py-1 text-xs font-semibold border border-primary rounded bg-background text-primary outline-none focus:ring-1 focus:ring-blue-500 min-w-20"
        />
      );
    }

    return (
      <span
        style={{
          backgroundColor: stack.color?.trim() ? stack.color : '#d1d5db',
          color: stack.name === 'Uncategorized' ? '#666' : '#000'
        }}
        className="font-semibold px-2 py-0.5 rounded-lg text-xs border truncate max-w-32"
        title={stack.name}
      >
        {stack.name}
      </span>
    );
  };

  const renderRecordCount = () => {
    if (isEditing) return null;
    return (
      <span className="text-xs text-gray-500 font-medium">
        {formatCompactNumber(visibleCards.length)} card{visibleCards.length === 1 ? '' : 's'}
        {!stack.isCollapsed && hasMore && ` (${formatCompactNumber(paginatedCards.length)} loaded)`}
      </span>
    );
  };

  const headerTitleNode = renderStackTitle();
  const headerCountNode = renderRecordCount();
  const headerMenuNode = renderMenu();

  const renderCards = () => (
    <>
      <div ref={cardsContainerRef} className="space-y-2 min-h-[80px] mb-2">
        {cardsToRender.map((card, index) => {
          const isDraggedCard = draggedCardId === card._meta.id;

          return (
            <React.Fragment key={card._meta.id}>
              {dropIndicatorPosition === index && !isDraggedCard && (
                <div className="h-1 bg-[var(--color-brand-600)] rounded-full -my-1 z-50 opacity-80"
                  style={dropIndicatorStyle}
                />
              )}
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/interactive-supports-focus, jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-tabindex */}
              <div
                role={onCardMove === undefined ? undefined : 'button'}
                aria-label={onCardMove === undefined ? undefined : 'Drag card to move'}
                draggable={onCardMove !== undefined}
                onDragStart={onCardMove === undefined ? undefined : getCardDragStartHandler(card)}
                onKeyDown={onCardMove === undefined ? undefined : handleCardKeyDown}
              >
                <div data-card-id={card._meta.id}>
                  <KanbanCard
                    card={card}
                    columns={gridColumns}
                    fieldConfig={fieldConfig}
                    groupCol={gridGroupCol}
                    onEdit={onCardEdit}
                  />
                </div>
              </div>
            </React.Fragment>
          );
        })}
        {dropIndicatorPosition === cardsToRender.length && (
          <div className="h-1 bg-[var(--color-brand-600)] rounded-full -my-1 z-50 opacity-80"
            style={dropIndicatorStyle}
          />
        )}
      </div>

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
  );

  const renderEmptyState = () => (
    <div className="text-center py-6 text-gray-500">
      <p className="text-xs font-medium mb-1">Empty stack</p>
      <p className="text-xs mb-3 text-gray-400">Looks like this stack does not have any records</p>
    </div>
  );

  const renderFooter = () => {
    if (!onCardCreate) return null;
    return (
      <div className={`${stack.isCollapsed ? '' : 'absolute bottom-0 left-0'} w-full border-t border-primary`}>
        <button
          onClick={handleNewRecordClick}
          className="w-full inline-flex items-center justify-center gap-1 text-primary-brand hover:text-hover-primary-dark text-xs font-medium p-3"
        >
          <Plus className="w-5 h-5" />
          New record
        </button>
      </div>
    );
  };

  const renderDeleteModal = () => (
    <DeleteConfirmModal
      isOpen={confirmOpen}
      title="Delete Stack"
      message={buildDeleteMessage(stack, groupFieldTitle)}
      onClose={closeConfirm}
      onConfirm={confirmDelete}
    />
  );

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
    globalThis.addEventListener('kanban-menu-open', onOtherMenuOpen as EventListener);
    return () => globalThis.removeEventListener('kanban-menu-open', onOtherMenuOpen as EventListener);
  }, []);

  const ContainerTag = onCardMove === undefined ? 'div' : 'section';

  return (
    <ContainerTag
      ref={containerRef}
      data-stack-id={stack.id}
      className={`kanban-stack bg-[var(--color-bg-secondary-subtle)] rounded-xl w-full md:w-96 transition-all duration-200 ${stack.isCollapsed ? 'self-start' : ''} border border-primary relative overflow-hidden ${stack.isCollapsed ? '' : 'pb-12'}`}
      aria-label={onCardMove === undefined ? undefined : `Drop zone for ${stack.name} stack`}
      onDragEnter={onCardMove === undefined ? undefined : handleDragEnter}
      onDragOver={onCardMove === undefined ? undefined : handleDragOver}
      onDragLeave={onCardMove === undefined ? undefined : handleDragLeave}
      onDrop={onCardMove === undefined ? undefined : handleContainerDrop}
    >
      {/* Stack Header */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/interactive-supports-focus */}
      <StackHeader
        className={headerConfig.className}
        dragProps={headerConfig.dragProps}
        showGrip={headerConfig.canDragHeader}
        titleNode={headerTitleNode}
        countNode={headerCountNode}
        onMenuMouseDown={handleMenuMouseDown}
        onMenuClick={handleMenuButtonClick}
        menuNode={headerMenuNode}
      />

      {/* Stack Content */}
      {!stack.isCollapsed && (
        <div
          className='p-4 max-h-[90%] overflow-y-auto'
          onScroll={handleCardsScroll}
        >
          {stack.cards.length === 0 ? renderEmptyState() : renderCards()}
        </div>
      )}
      {/* New record button - only show if onCardCreate is provided (user has permission) */}
      {renderFooter()}

      {/* Delete confirmation modal */}
      {renderDeleteModal()}
    </ContainerTag>
  );
});

KanbanStack.displayName = 'KanbanStack';

export default KanbanStack;
