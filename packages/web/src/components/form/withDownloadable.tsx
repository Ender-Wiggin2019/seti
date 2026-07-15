/** biome-ignore-all lint/suspicious/noExplicitAny: <DEBUG FUNCTION> */
/*
 * @Author: Ender-Wiggin
 * @Date: 2025-10-30 10:00:00
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-12-01 16:30:05
 * @Description: Higher-order component to make any component downloadable as an image via click.
 */
import React, { useCallback, useRef } from 'react';

import { downloadImage } from '@/utils/file';

export function withDownloadable<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  getFileName: (props: P) => string,
) {
  const ComponentWithDownload: React.FC<P> = (props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    const handleClick = useCallback(() => {
      const title = getFileName(props);
      void downloadImage(containerRef.current, title);
    }, [props]);

    const W = WrappedComponent as React.ComponentType<any>;
    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <W {...(props as any)} />
      </div>
    );
  };

  ComponentWithDownload.displayName = `WithDownloadable(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithDownload;
}

export default withDownloadable;
