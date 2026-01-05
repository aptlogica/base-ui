import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Info, X, ChevronRight, ChevronDown, FileJson } from 'lucide-react';

interface JSONFieldProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  isBorder?: boolean;
  config?: {
    defaultValue?: any;
    [key: string]: any;
  };
}

interface JSONTreeNodeProps {
  data: any;
  path: string;
  level: number;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onValueChange: (path: string, newValue: any) => void;
  disabled?: boolean;
}

// Recursive component for rendering JSON tree
const JSONTreeNode: React.FC<JSONTreeNodeProps> = ({
  data,
  path,
  level,
  expandedPaths,
  onToggleExpand,
  onValueChange,
  disabled = false
}) => {
  const isExpanded = expandedPaths.has(path);
  const indent = level * 20;

  const handleToggle = () => {
    if (!disabled) {
      onToggleExpand(path);
    }
  };

  const renderValue = (val: any, keyPath: string): React.ReactNode => {
    if (val === null) {
      return <span className="text-purple-600">null</span>;
    }

    if (typeof val === 'boolean') {
      return <span className="text-blue-600">{String(val)}</span>;
    }

    if (typeof val === 'number') {
      return <span className="text-green-600">{val}</span>;
    }

    if (typeof val === 'string') {
      return <span className="text-orange-600">"{val}"</span>;
    }

    if (Array.isArray(val)) {
      const isValExpanded = expandedPaths.has(keyPath);
      return (
        <span className="text-gray-600">
          [{isValExpanded ? '' : ` ${val.length} items`}]
        </span>
      );
    }

    if (typeof val === 'object' && val !== null) {
      const keys = Object.keys(val);
      const isValExpanded = expandedPaths.has(keyPath);
      return (
        <span className="text-gray-600">
          {'{'}{isValExpanded ? '' : ` ${keys.length} keys`}{'}'}
        </span>
      );
    }

    return <span>{String(val)}</span>;
  };

  if (Array.isArray(data)) {
    return (
      <div className="json-tree-node">
        <div
          className="flex items-center cursor-pointer hover:bg-gray-50 py-0.5"
          onClick={handleToggle}
          style={{ paddingLeft: `${indent}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0" />
          )}
          <span className="text-gray-600">[</span>
          <span className="text-gray-500 ml-1 text-xs">{data.length} items</span>
          {!isExpanded && <span className="text-gray-600 ml-1">]</span>}
        </div>
        {isExpanded && (
          <div>
            {data.map((item, index) => {
              const itemPath = `${path}[${index}]`;
              const isItemExpanded = expandedPaths.has(itemPath);
              const isComplex = typeof item === 'object' && item !== null;

              return (
                <div key={index}>
                  <div
                    className="flex items-center py-0.5 hover:bg-gray-50"
                    style={{ paddingLeft: `${indent + 20}px` }}
                  >
                    {isComplex ? (
                      <>
                        {isItemExpanded ? (
                          <ChevronDown
                            className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(itemPath);
                            }}
                          />
                        ) : (
                          <ChevronRight
                            className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(itemPath);
                            }}
                          />
                        )}
                        <span className="text-gray-500 mr-1">{index}:</span>
                        {renderValue(item, itemPath)}
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 mr-1" />
                        <span className="text-gray-500 mr-1">{index}:</span>
                        {renderValue(item, itemPath)}
                      </>
                    )}
                  </div>
                  {isComplex && isItemExpanded && (
                    <div>
                      {Array.isArray(item) ? (
                        <JSONTreeNode
                          data={item}
                          path={itemPath}
                          level={level + 2}
                          expandedPaths={expandedPaths}
                          onToggleExpand={onToggleExpand}
                          onValueChange={onValueChange}
                          disabled={disabled}
                        />
                      ) : (
                        <JSONTreeNode
                          data={item}
                          path={itemPath}
                          level={level + 2}
                          expandedPaths={expandedPaths}
                          onToggleExpand={onToggleExpand}
                          onValueChange={onValueChange}
                          disabled={disabled}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ paddingLeft: `${indent}px` }} className="text-gray-600">]</div>
          </div>
        )}
      </div>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    return (
      <div className="json-tree-node">
        <div
          className="flex items-center cursor-pointer hover:bg-gray-50 py-0.5"
          onClick={handleToggle}
          style={{ paddingLeft: `${indent}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0" />
          )}
          <span className="text-gray-600">{'{'}</span>
          <span className="text-gray-500 ml-1 text-xs">{keys.length} keys</span>
          {!isExpanded && <span className="text-gray-600 ml-1">{'}'}</span>}
        </div>
        {isExpanded && (
          <div>
            {keys.map((key) => {
              const keyPath = path ? `${path}.${key}` : key;
              const val = data[key];
              const isComplex = typeof val === 'object' && val !== null;
              const isValExpanded = expandedPaths.has(keyPath);

              return (
                <div key={key}>
                  <div
                    className="flex items-center py-0.5 hover:bg-gray-50"
                    style={{ paddingLeft: `${indent + 20}px` }}
                  >
                    {isComplex ? (
                      <>
                        {isValExpanded ? (
                          <ChevronDown
                            className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(keyPath);
                            }}
                          />
                        ) : (
                          <ChevronRight
                            className="w-4 h-4 text-gray-500 mr-1 flex-shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleExpand(keyPath);
                            }}
                          />
                        )}
                        <span className="text-blue-600 font-medium">"{key}"</span>
                        <span className="text-gray-600 mx-1">:</span>
                        {renderValue(val, keyPath)}
                      </>
                    ) : (
                      <>
                        <span className="w-4 h-4 mr-1" />
                        <span className="text-blue-600 font-medium">"{key}"</span>
                        <span className="text-gray-600 mx-1">:</span>
                        {renderValue(val, keyPath)}
                      </>
                    )}
                  </div>
                  {isComplex && isValExpanded && (
                    <div>
                      {Array.isArray(val) ? (
                        <JSONTreeNode
                          data={val}
                          path={keyPath}
                          level={level + 2}
                          expandedPaths={expandedPaths}
                          onToggleExpand={onToggleExpand}
                          onValueChange={onValueChange}
                          disabled={disabled}
                        />
                      ) : (
                        <JSONTreeNode
                          data={val}
                          path={keyPath}
                          level={level + 2}
                          expandedPaths={expandedPaths}
                          onToggleExpand={onToggleExpand}
                          onValueChange={onValueChange}
                          disabled={disabled}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ paddingLeft: `${indent}px` }} className="text-gray-600">{'}'}</div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export const JSONField: React.FC<JSONFieldProps> = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  isBorder = false,
  config = {}
}) => {
  // Always use pretty print (no longer configurable)
  const prettyPrint = true;
  const { defaultValue = null } = config;

  const [localValue, setLocalValue] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [jsonData, setJsonData] = useState<any>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'tree' | 'text'>('tree');

  // Parse JSON value into object for tree view
  const parseJsonValue = useCallback((val: any) => {
    if (val === null || val === undefined || val === '') {
      return defaultValue || null;
    }
    if (typeof val === 'object') {
      return val;
    }
    if (typeof val === 'string' && val.trim()) {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return null;
  }, [defaultValue]);

  useEffect(() => {
    // Use default value if value is empty/undefined/null and default value is provided
    const displayValue = (value !== null && value !== undefined && value !== '') ? value : (defaultValue || '');

    // Handle different types of displayValue
    let jsonString = '';
    if (displayValue && typeof displayValue === 'object') {
      jsonString = JSON.stringify(displayValue, null, prettyPrint ? 2 : 0);
    } else if (typeof displayValue === 'string' && displayValue.trim()) {
      // If it's already a string, try to parse and re-stringify for consistent formatting
      try {
        const parsed = JSON.parse(displayValue);
        jsonString = JSON.stringify(parsed, null, prettyPrint ? 2 : 0);
      } catch {
        jsonString = displayValue;
      }
    } else {
      jsonString = '';
    }

    setLocalValue(jsonString);
  }, [value, defaultValue, prettyPrint]);

  useEffect(() => {
    if (isModalOpen) {
      // Use the same logic as the display value
      const displayValue = (value !== null && value !== undefined && value !== '') ? value : (defaultValue || '');

      // Parse for tree view
      const parsed = parseJsonValue(displayValue);
      setJsonData(parsed);

      // Expand root by default
      if (parsed && (typeof parsed === 'object' || Array.isArray(parsed))) {
        setExpandedPaths(new Set(['']));
      }

      // Set textarea value
      let jsonString = '';
      if (displayValue && typeof displayValue === 'object') {
        jsonString = JSON.stringify(displayValue, null, prettyPrint ? 2 : 0);
      } else if (typeof displayValue === 'string' && displayValue.trim()) {
        try {
          const parsed = JSON.parse(displayValue);
          jsonString = JSON.stringify(parsed, null, prettyPrint ? 2 : 0);
        } catch {
          jsonString = displayValue;
        }
      } else {
        jsonString = '';
      }

      setModalValue(jsonString);
      setError(null);

      // Always default to tree view
      setViewMode('tree');
    }
  }, [isModalOpen, value, defaultValue, prettyPrint, parseJsonValue]);

  const handleModalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setModalValue(newValue);
    try {
      const parsed = JSON.parse(newValue);
      setError(null);
      setJsonData(parsed);
    } catch {
      setError('Invalid JSON');
    }
  };

  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleValueChange = useCallback((path: string, newValue: any) => {
    // This would be used for inline editing - for now we'll use textarea mode for editing
    // Can be enhanced later
  }, []);

  const handleSave = () => {
    try {
      let parsed;
      if (viewMode === 'tree') {
        // Use jsonData from tree view
        parsed = jsonData;
      } else {
        // Parse from textarea
        parsed = JSON.parse(modalValue);
      }

      if (parsed === null || parsed === undefined) {
        setError('Invalid JSON');
        return;
      }

      setError(null);
      onChange(parsed);
      setIsModalOpen(false);
    } catch {
      setError('Invalid JSON');
    }
  };

  // Truncated preview for inline view
  const getPreview = () => {
    if (!localValue) return '';
    let preview = localValue.replace(/\s+/g, ' ');
    if (preview.length > 60) {
      preview = preview.slice(0, 57) + '...';
    }
    return preview;
  };

  return (
    <div className={`relative ${isBorder ? "field-component-border" : ""}`} >
      {/* Inline preview with floating expand icon */}
      <div
        className={`relative flex items-center px-2 py-1 min-h-[32px] rounded cursor-pointer hover:border-blue-400 transition-all ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsModalOpen(true)}
        tabIndex={0}
        style={{ fontFamily: 'monospace', fontSize: 13 }}
      >
        <span className="truncate overflow-hidden whitespace-nowrap block flex-1 text-gray-800" title={localValue || placeholder}>
          {getPreview() || <span className="text-sm text-gray-400">{placeholder}</span>}
        </span>
        <button
          type="button"
          className="absolute right-2 text-gray-400 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg border shadow-md bg-card hover:bg-gray-200 transition-all z-0"
          onClick={e => { e.stopPropagation(); setIsModalOpen(true); }}
          tabIndex={0}
          aria-label="Expand JSON editor"
          disabled={disabled}
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      {/* Modal for editing JSON */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 backdrop-blur-sm bg-opacity-40" onClick={() => setIsModalOpen(false)} />
          {/* Modal Content */}
          <div className="relative bg-[var(--color-card)] border rounded-xl shadow-xl w-full max-w-5xl h-[85vh] p-6 flex flex-col z-10">
            <div className="flex items-center mb-4">
              <FileJson className="w-8 h-8 rounded icon-primary p-1 mr-2" />
              <span className="text-lg font-medium text-[var(--color-text-primary)]">Edit JSON</span>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1 text-xs rounded-xl transition-colors ${viewMode === 'tree'
                    ? 'bg-[var(--color-brand-600)] text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Tree
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-3 py-1 text-xs rounded-xl transition-colors ${viewMode === 'text'
                    ? 'bg-[var(--color-brand-600)] text-black'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Text
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto min-h-[400px]">
              {viewMode === 'tree' ? (
                <div className="w-full h-full bg-[var(--background)] border rounded-xl p-4 text-sm font-mono overflow-auto">
                  {jsonData !== null && jsonData !== undefined ? (
                    <JSONTreeNode
                      data={jsonData}
                      path=""
                      level={0}
                      expandedPaths={expandedPaths}
                      onToggleExpand={handleToggleExpand}
                      onValueChange={handleValueChange}
                      disabled={disabled}
                    />
                  ) : (
                    <div className="text-gray-400 italic">{placeholder || 'Empty JSON'}</div>
                  )}
                </div>
              ) : (
                <textarea
                  value={modalValue}
                  onChange={handleModalChange}
                  rows={12}
                  className="w-full h-full bg-[var(--background)] text-[var(--color-text-primary)] border rounded-xl p-3 text-sm font-mono focus:outline-none focus:border-[var(--color-brand-600)] transition-all resize-none"
                  placeholder={placeholder}
                  disabled={disabled}
                />
              )}
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red-600 mt-2">
                <Info className="w-4 h-4 text-red-500" />
                {error}
              </div>
            )}
            <div className="flex justify-end mt-4 gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] border border-gray-300 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium btn-primary rounded transition-colors"
                disabled={!!error}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
