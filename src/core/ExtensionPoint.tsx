import React, { ReactNode, Suspense } from 'react';
import { useExtensions } from './PluginFrameworkContext';
import { Loader } from '../components/ui/Loader';

// Simple inline error boundary for extension points
const ExtensionErrorBoundary: React.FC<{
  children: React.ReactNode;
  pluginId: string;
}> = ({ children, pluginId }) => {
  return (
    <div className="extension-wrapper" data-plugin={pluginId}>
      {children}
    </div>
  );
};

interface ExtensionPointProps {
  id: string;
  render?: (extensions: any[]) => ReactNode;
  props?: Record<string, any>;
  fallback?: ReactNode | (() => ReactNode);
}

export const ExtensionPoint: React.FC<ExtensionPointProps> = ({ id, render, props = {}, fallback }) => {
  const extensions = useExtensions(id);

  // --- Support replace/hide logic ---
  // If any extension has replace: true, render only that extension
  const replaceExt = extensions.find((ext: any) => ext.replace);
  if (replaceExt) {
    return <>{replaceExt.render ? replaceExt.render(props) : null}</>;
  }
  // If any extension has hide: true, skip rendering children
  const hideExt = extensions.find((ext: any) => ext.hide);
  if (hideExt) {
    return null;
  }

  // Special handling for 'view' extension point - select first renderer that returns content
  // REACT CONCURRENT: Wrap view rendering in Suspense for better loading states
  if (id === 'view') {
    const sortedExtensions = extensions.sort((a: any, b: any) => (a.order || 100) - (b.order || 100));
    for (const ext of sortedExtensions) {
      if (ext.render) {
        const rendered = ext.render(props);
        if (rendered) {
          return (
            <Suspense
              key={ext.id}
              fallback={
                <div className="h-full flex items-center justify-center">
                  <Loader size={10} />
                </div>
              }
            >
              {rendered}
            </Suspense>
          );
        }
      }
    }
    if (typeof fallback === 'function') return <>{(fallback as Function)()}</>;
    if (fallback) return <>{fallback}</>;
    return null;
  }

  // Otherwise, render all extensions in order, then children
  return (
    <>
      {extensions.sort((a: any, b: any) => (a.order || 100) - (b.order || 100)).map((ext: any) => (ext.render ? <React.Fragment key={ext.id}>{ext.render(props)}</React.Fragment> : null))}
      {render ? render(extensions) : null}
    </>
  );
};