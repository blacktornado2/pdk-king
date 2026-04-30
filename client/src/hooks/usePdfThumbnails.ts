import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

export interface ThumbnailState {
  thumbnails: string[];
  pageCount: number;
  loading: boolean;
  error: string | null;
}

export function usePdfThumbnails(file: File | null): ThumbnailState {
  const [state, setState] = useState<ThumbnailState>({
    thumbnails: [],
    pageCount: 0,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!file) {
      setState({ thumbnails: [], pageCount: 0, loading: false, error: null });
      return;
    }

    let cancelled = false;
    setState({ thumbnails: [], pageCount: 0, loading: true, error: null });

    (async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total = pdf.numPages;

        const urls: string[] = [];
        for (let i = 1; i <= total; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 0.4 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;

          await page.render({ canvasContext: ctx, canvas, viewport }).promise;
          urls.push(canvas.toDataURL('image/jpeg', 0.8));
          // Release GPU-backed pixel buffer immediately; the data URL is all we need.
          canvas.width = 0;
          canvas.height = 0;
        }

        if (!cancelled) {
          setState({ thumbnails: urls, pageCount: total, loading: false, error: null });
        }
      } catch {
        if (!cancelled) {
          setState({ thumbnails: [], pageCount: 0, loading: false, error: 'Failed to read PDF.' });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [file]);

  return state;
}
