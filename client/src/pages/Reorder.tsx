import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { SortablePageCard } from '../components/pdf/SortablePageCard';
import { Button } from '../components/ui/Button';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { usePdfThumbnails } from '../hooks/usePdfThumbnails';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

export function Reorder() {
  const [file, setFile] = useState<File | null>(null);
  // order holds the original 0-based page indices in the current display order
  const [order, setOrder] = useState<number[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { thumbnails, pageCount, loading, error: thumbError } = usePdfThumbnails(file);
  const { job } = useJobPolling(jobId);

  // Initialise order once thumbnails are ready
  if (thumbnails.length > 0 && order.length !== thumbnails.length) {
    setOrder(Array.from({ length: thumbnails.length }, (_, i) => i));
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIdx = prev.indexOf(Number(active.id));
      const newIdx = prev.indexOf(Number(over.id));
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  const handleApply = async () => {
    if (!file || order.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.reorder(file, order);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setOrder([]);
    setJobId(null);
    setUploadError(null);
  };

  const isDefaultOrder = order.every((v, i) => v === i);

  return (
    <PageWrapper
      title="Reorder Pages"
      description="Drag pages into the order you want, then apply."
    >
      {!jobId && (
        <>
          {!file && <UploadZone onFiles={(f) => setFile(f[0])} />}

          {file && loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full w-7 h-7 animate-spin" />
              <p className="font-mono text-[11px] text-[var(--text-3)]">Generating page previews…</p>
            </div>
          )}

          {thumbError && (
            <p className="font-mono text-sm text-[#EF4444] mt-4">{thumbError}</p>
          )}

          {thumbnails.length > 0 && !loading && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[11px] text-[var(--text-3)]">{pageCount} pages · drag to reorder</p>
                <button onClick={() => setOrder(Array.from({ length: pageCount }, (_, i) => i))}
                  className="text-xs uppercase tracking-widest text-[var(--text-3)] hover:text-[var(--accent)] transition-colors">
                  Reset order
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={order.map(String)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {order.map((originalIdx) => (
                      <SortablePageCard
                        key={originalIdx}
                        id={String(originalIdx)}
                        thumbnail={thumbnails[originalIdx]}
                        pageLabel={order.indexOf(originalIdx) + 1}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}
              <div className="mt-8 flex gap-3">
                <Button onClick={handleApply} disabled={isDefaultOrder} loading={uploading}>Apply new order</Button>
                <Button variant="ghost" onClick={reset}>Cancel</Button>
              </div>
              {isDefaultOrder && (
                <p className="mt-3 font-mono text-[11px] text-[var(--text-4)]">Move at least one page to enable apply.</p>
              )}
            </>
          )}
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Applying new page order…"
          doneLabel="Your reordered PDF is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Reorder another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
