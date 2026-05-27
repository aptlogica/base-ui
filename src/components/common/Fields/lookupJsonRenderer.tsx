// Copyright (c) 2026 Aptlogica Technologies Private Limited
// SPDX-License-Identifier: MIT
// Websites: https://www.aptlogica.com | https://www.serenibase.com
// Support: support@aptlogica.com | support@serenibase.com
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Maximize2, X } from 'lucide-react';

const normalizeJson = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return value;
  const text = String(value).trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const previewText = (value: unknown): string => {
  const normalized = normalizeJson(value);
  if (normalized === null) return '';
  const raw = typeof normalized === 'string' ? normalized : JSON.stringify(normalized);
  const single = raw.replaceAll(/\s+/g, ' ');
  return single.length > 56 ? `${single.slice(0, 53)}...` : single;
};

interface TreeNodeProps {
  data: any;
  path: string;
  level: number;
  expanded: Set<string>;
  onToggle: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ data, path, level, expanded, onToggle }) => {
  const isExpanded = expanded.has(path);
  const indent = level * 18;
  const renderPrimitive = (val: unknown): React.ReactNode => {
    if (val === null) return <span className="text-purple-600">null</span>;
    if (typeof val === 'boolean') return <span className="text-blue-600">{String(val)}</span>;
    if (typeof val === 'number') return <span className="text-green-600">{val}</span>;
    if (typeof val === 'string') return <span className="text-orange-600">"{val}"</span>;
    return <span className="text-gray-800">{String(val)}</span>;
  };

  if (Array.isArray(data)) {
    return (
      <div>
        <button type="button" className="flex items-center py-0.5 hover:bg-gray-50 rounded" style={{ paddingLeft: indent }} onClick={() => onToggle(path)}>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500 mr-1" /> : <ChevronRight className="w-4 h-4 text-gray-500 mr-1" />}
          <span className="text-gray-700">[ {data.length} items ]</span>
        </button>
        {isExpanded && data.map((item, index) => {
          const itemPath = `${path}[${index}]`;
          const complex = typeof item === 'object' && item !== null;
          return (
            <div key={itemPath}>
              {complex ? (
                <TreeNode data={item} path={itemPath} level={level + 1} expanded={expanded} onToggle={onToggle} />
              ) : (
                <div className="py-0.5 text-gray-800" style={{ paddingLeft: (level + 1) * 18 }}>
                  <span className="text-gray-500 mr-1">{index}:</span>{renderPrimitive(item)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data);
    return (
      <div>
        <button type="button" className="flex items-center py-0.5 hover:bg-gray-50 rounded" style={{ paddingLeft: indent }} onClick={() => onToggle(path)}>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500 mr-1" /> : <ChevronRight className="w-4 h-4 text-gray-500 mr-1" />}
          <span className="text-gray-700">{`{ ${keys.length} keys }`}</span>
        </button>
        {isExpanded && keys.map((key) => {
          const val = data[key];
          const keyPath = `${path}.${key}`;
          const complex = typeof val === 'object' && val !== null;
          return (
            <div key={keyPath}>
              {complex ? (
                <div style={{ paddingLeft: (level + 1) * 18 }}>
                  <span className="text-blue-600">"{key}"</span>
                  <span className="text-gray-600">:</span>
                  <TreeNode data={val} path={keyPath} level={level + 1} expanded={expanded} onToggle={onToggle} />
                </div>
              ) : (
                <div className="py-0.5 text-gray-800" style={{ paddingLeft: (level + 1) * 18 }}>
                  <span className="text-blue-600">"{key}"</span>
                  <span className="text-gray-600">: </span>
                  {renderPrimitive(val)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="py-0.5 text-gray-800" style={{ paddingLeft: indent }}>
      {String(data)}
    </div>
  );
};

export const LookupJsonValue: React.FC<{ items: any[] }> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));

  const treeData = useMemo(() => {
    if (!items.length) return null;
    const normalized = items.map((v) => normalizeJson(v)).filter((v) => v !== null);
    if (normalized.length === 0) return null;
    if (normalized.length === 1) return normalized[0];
    return normalized;
  }, [items]);

  const preview = useMemo(() => previewText(items[0]), [items]);
  if (!preview) return null;

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <>
      <div className="inline-flex items-center gap-1">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-background text-gray-700 border border-gray-200 whitespace-nowrap font-mono">
          <span className="truncate max-w-[180px]" title={preview}>{preview}</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="w-7 h-7 text-gray-400 flex items-center justify-center rounded-lg border shadow-xs hover:bg-gray-200 transition-all"
          aria-label="Expand JSON"
          title="Expand JSON"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <button type="button" className="absolute inset-0 backdrop-blur-sm bg-opacity-40" aria-label="Close modal" tabIndex={-1} onClick={() => setOpen(false)} />
          <div className="relative bg-card border rounded-xl shadow-xl w-full max-w-4xl h-[80vh] p-5 flex flex-col z-10">
            <div className="flex items-center mb-3">
              <span className="text-lg font-medium text-primary">JSON Tree</span>
              <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto min-h-[320px] bg-background border rounded-xl p-3 text-sm font-mono">
              {treeData === null ? (
                <div className="text-gray-400 italic">Empty JSON</div>
              ) : (
                <TreeNode data={treeData} path="root" level={0} expanded={expanded} onToggle={toggle} />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
