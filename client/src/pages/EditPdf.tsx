import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem as PdfTextItem } from 'pdfjs-dist/types/src/display/api';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';
import { formatBytes } from '../lib/format';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href;

const SCALE = 1.8;

interface TextItem {
  pageIndex: number;
  itemIndex: number;
  str: string;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfFontSize: number;
  fontName: string;
  cx: number;
  cy: number;
  cw: number;
  ch: number;
}

interface PageData {
  imageUrl: string;
  width: number;
  height: number;
  items: TextItem[];
}

export function EditPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  useEffect(() => {
    if (!file) { setPages([]); return; }
    let cancelled = false;
    setLoading(true);
    setEdits(new Map());
    setCurrentPage(0);

    (async () => {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      const result: PageData[] = [];

      for (let p = 1; p <= pdf.numPages; p++) {
        if (cancelled) return;
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: SCALE });
        const naturalVp = page.getViewport({ scale: 1 });
        const pageHeightPdf = naturalVp.height;

        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, canvas, viewport: vp }).promise;

        const tc = await page.getTextContent();
        const items: TextItem[] = tc.items
          .filter((it): it is PdfTextItem => 'str' in it && it.str.trim().length > 0)
          .map((it, idx) => {
            const [, , , d, pdfX, pdfY] = it.transform;
            const pdfFontSize = Math.abs(d) || it.height || 12;
            const pdfWidth = it.width || pdfFontSize * it.str.length * 0.6;
            const cx = pdfX * SCALE;
            const cy = (pageHeightPdf - pdfY) * SCALE - pdfFontSize * SCALE * 0.85;
            return {
              pageIndex: p - 1,
              itemIndex: idx,
              str: it.str,
              pdfX, pdfY,
              pdfWidth, pdfFontSize,
              fontName: (it as PdfTextItem & { fontName?: string }).fontName ?? '',
              cx, cy,
              cw: Math.max(pdfWidth * SCALE, 10),
              ch: pdfFontSize * SCALE,
            };
          });

        result.push({ imageUrl: canvas.toDataURL(), width: vp.width, height: vp.height, items });
      }

      if (!cancelled) { setPages(result); setLoading(false); }
    })().catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [file]);

  const itemKey = (item: TextItem) => `${item.pageIndex}:${item.itemIndex}`;

  const startEdit = (item: TextItem) => {
    const key = itemKey(item);
    setEditingKey(key);
    setEditValue(edits.get(key) ?? item.str);
  };

  const commitEdit = (item: TextItem) => {
    const key = itemKey(item);
    const val = editValue;
    setEdits((prev) => {
      const next = new Map(prev);
      if (val.trim() && val !== item.str) next.set(key, val);
      else next.delete(key);
      return next;
    });
    setEditingKey(null);
  };

  const handleApply = async () => {
    if (!file || edits.size === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const editsList = Array.from(edits.entries()).flatMap(([key, newText]) => {
        const [pi, ii] = key.split(':').map(Number);
        if (!Number.isFinite(pi) || !Number.isFinite(ii)) return [];
        const item = pages[pi]?.items[ii];
        if (!item) return [];
        return [{
          pageIndex: item.pageIndex,
          x: item.pdfX,
          y: item.pdfY,
          width: item.pdfWidth,
          fontSize: item.pdfFontSize,
          fontName: item.fontName,
          newText,
        }];
      });
      const { data } = await pdfApi.editPdf(file, editsList);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPages([]);
    setEdits(new Map());
    setEditingKey(null);
    setJobId(null);
    setUploadError(null);
  };

  const page = pages[currentPage];
  const editCount = edits.size;

  return (
    <PageWrapper
      title="Edit PDF Text"
      description="Click any text to edit it. Changes are applied with matching font and size."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : loading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-3)] py-12 justify-center">
              <span className="border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full w-4 h-4 animate-spin" />
              Loading PDF…
            </div>
          ) : page ? (
            <>
              <FileCard
                name={file.name}
                meta={formatBytes(file.size)}
                onRemove={reset}
              />

              {/* Toolbar */}
              <div className="flex items-center justify-between mt-4 mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-md border border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <span className="text-xs text-[var(--text-3)]">
                    Page <span className="font-mono">{currentPage + 1}</span> of <span className="font-mono">{pages.length}</span>
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(pages.length - 1, p + 1))}
                    disabled={currentPage === pages.length - 1}
                    className="p-1.5 rounded-md border border-[var(--border)] text-[var(--text-3)] hover:bg-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
                <span className="text-xs text-[var(--text-4)]">
                  {editCount > 0
                    ? `${editCount} edit${editCount !== 1 ? 's' : ''} — hover text to edit`
                    : 'Hover over text to edit'}
                </span>
              </div>

              {/* Page canvas with text overlays */}
              <div className="overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg)]">
                <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
                  <img
                    src={page.imageUrl}
                    width={page.width}
                    height={page.height}
                    draggable={false}
                    style={{ display: 'block', userSelect: 'none' }}
                  />
                  {page.items.map((item) => {
                    const key = itemKey(item);
                    const isEditing = editingKey === key;
                    const editedText = edits.get(key);
                    const isEdited = editedText !== undefined;

                    const baseStyle: CSSProperties = {
                      position: 'absolute',
                      left: item.cx,
                      top: item.cy,
                      width: isEditing ? Math.max(item.cw, 120) : item.cw,
                      height: item.ch,
                      fontSize: item.pdfFontSize * SCALE,
                      lineHeight: '1',
                      padding: 0,
                      boxSizing: 'border-box',
                    };

                    if (isEditing) {
                      return (
                        <input
                          key={key}
                          autoFocus
                          style={{
                            ...baseStyle,
                            background: 'rgba(238, 242, 255, 0.96)',
                            border: '1.5px solid #6366f1',
                            outline: 'none',
                            color: '#1e1b4b',
                            fontFamily: 'Helvetica, Arial, sans-serif',
                            zIndex: 10,
                          }}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') setEditingKey(null);
                          }}
                        />
                      );
                    }

                    return (
                      <div
                        key={key}
                        style={{
                          ...baseStyle,
                          cursor: 'text',
                          backgroundColor: isEdited ? 'rgba(255, 251, 235, 0.93)' : 'transparent',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                        className={isEdited ? '' : 'hover:bg-indigo-500/10'}
                        onClick={() => startEdit(item)}
                        title={isEdited ? `→ "${editedText}"` : `"${item.str}"`}
                      >
                        {isEdited && (
                          <span style={{
                            fontSize: item.pdfFontSize * SCALE,
                            lineHeight: 1,
                            color: '#92400e',
                            fontFamily: 'Helvetica, Arial, sans-serif',
                          }}>
                            {editedText}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

              <div className="mt-5 flex gap-3">
                <Button
                  onClick={handleApply}
                  disabled={editCount === 0}
                  loading={uploading}
                >
                  Apply {editCount > 0 ? `${editCount} Edit${editCount !== 1 ? 's' : ''}` : 'Edits'}
                </Button>
                <Button variant="ghost" onClick={reset}>Clear</Button>
              </div>
            </>
          ) : null}
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Saving your edits..."
          doneLabel="PDF edited!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Edit another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
