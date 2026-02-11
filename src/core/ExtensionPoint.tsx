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

// Helper: Sort extensions by order
const sortExtensions = (extensions: any[]): any[] =>
  extensions.toSorted((a: any, b: any) => (a.order || 100) - (b.order || 100));

// Helper: Check for replace extension
const getReplaceExtension = (extensions: any[]): any =>
  extensions.find((ext: any) => ext.replace);

// Helper: Check for hide extension
const getHideExtension = (extensions: any[]): any =>
  extensions.find((ext: any) => ext.hide);

// Helper: Render fallback content
const renderFallback = (fallback?: ReactNode | (() => ReactNode)): ReactNode => {
  if (typeof fallback === 'function') return <>{(fallback as Function)()}</>;
  return fallback ? <>{fallback}</> : null;
};

// Helper: Find and render first view extension with content
const findFirstViewExtension = (
  extensions: any[],
  props: Record<string, any>
): { ext: any; rendered: ReactNode } | null => {
  const sorted = sortExtensions(extensions);
  for (const ext of sorted) {
    if (ext.render) {
      const rendered = ext.render(props);
      if (rendered) return { ext, rendered };
    }
  }
  return null;
};

// Helper: Render view extension with suspense
const renderViewExtensionWithSuspense = (
  viewData: { ext: any; rendered: ReactNode } | null,
  fallback?: ReactNode | (() => ReactNode)
): ReactNode => {
  if (!viewData) return renderFallback(fallback);

  return (
    <Suspense
      key={viewData.ext.id}
      fallback={
        <div className="h-full flex items-center justify-center">
          <Loader size={10} />
        </div>
      }
    >
      {viewData.rendered}
    </Suspense>
  );
};

export const ExtensionPoint: React.FC<ExtensionPointProps> = ({ id, render, props = {}, fallback }) => {
  const extensions = useExtensions(id);

  // Check for replace extension
  const replaceExt = getReplaceExtension(extensions);
  if (replaceExt) {
    return <>{replaceExt.render ? replaceExt.render(props) : null}</>;
  }

  // Check for hide extension
  const hideExt = getHideExtension(extensions);
  if (hideExt) {
    return null;
  }

  // Special handling for 'view' extension point
  if (id === 'view') {
    const viewData = findFirstViewExtension(extensions, props);
    return renderViewExtensionWithSuspense(viewData, fallback);
  }

  // Default: Render all extensions in order, then children
  return (
    <>
      {sortExtensions(extensions).map((ext: any) => (ext.render ? <React.Fragment key={ext.id}>{ext.render(props)}</React.Fragment> : null))}
      {render ? render(extensions) : null}
    </>
  );
};