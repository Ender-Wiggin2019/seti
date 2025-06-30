/*
 * @Author: Ender-Wiggin
 * @Date: 2025-05-22 01:06:41
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-06-03 19:33:00
 * @Description:
 */
import React, { useRef } from 'react';

import { useToast } from '@/hooks/use-toast';

import { downloadImage } from '@/utils/file';

type DownloadableProps = {
  fileName?: string;
};

const withDownloadableImage = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  // Remove unused ref parameter and type downloadRef correctly
  return (props: P & DownloadableProps) => {
    const downloadRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast();
    const handleDownloadImage = async () => {
      try {
        toast({ title: 'Please wait...' });

        await downloadImage(
          downloadRef.current,
          props.fileName || 'download',
          (msg: string) => {
            toast({ title: msg, variant: 'success' });
          },
          (msg: string) => {
            toast({ title: msg, variant: 'destructive' });
          }
        );
      } catch (error) {
        // Handle error appropriately (logging removed to avoid console statement)
        /* Error downloading image */
      }
    };

    return (
      <div ref={downloadRef} onClick={handleDownloadImage}>
        <WrappedComponent {...props} />
        {/* <button onClick={handleDownloadImage}>Download as Image</button> */}
      </div>
    );
  };
};

export default withDownloadableImage;
