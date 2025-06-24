/*
 * @Author: Ender-Wiggin
 * @Date: 2025-04-01 23:48:39
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-04-02 00:36:38
 * @Description:
 */

import { toPng } from 'html-to-image';

import { IBaseCard } from '@/types/BaseCard';

const blobUrlToBase64 = async (
  blobUrl: string
): Promise<string | ArrayBuffer | null> => {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const exportToJson = async (
  card: IBaseCard,
  onSuccess?: () => void,
  onError?: () => void
) => {
  try {
    const tmp = { ...card };

    if (tmp.image) {
      tmp.image = (await blobUrlToBase64(tmp.image)) as string;
    }

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tmp));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute(
      'download',
      `${card.id || 'fan-made-card'}.seti`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    onSuccess?.();
  } catch {
    onError?.();
  }
};

export const downloadImage = async (
  element: HTMLElement | null,
  title?: string,
  onSuccess?: (msg: string) => void,
  onError?: (msg: string) => void
) => {
  if (element === null) {
    onError?.('The image is empty!');
    return;
  }

  try {
    const dataUrl = await toPng(element, { quality: 0.8, pixelRatio: 10 });
    const link = document.createElement('a');
    link.download = title || 'diy-card' + '.png';
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccess?.('Download image successfully!');
  } catch (err) {
    onError?.(
      'Download image failed! If you are using Firefox, please try another browser.'
    );
  }
};
