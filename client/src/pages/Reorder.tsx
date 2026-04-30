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

  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';

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
              <svg className="animate-spin h-7 w-7 text-indigo-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              <p className="text-sm text-gray-400">Generating page previews…</p>
            </div>
          )}

          {thumbError && (
            <p className="text-sm text-red-500 mt-4">{thumbError}</p>
          )}

          {thumbnails.length > 0 && !loading && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-400">{pageCount} pages · drag to reorder</p>
                <button
                  onClick={() => setOrder(Array.from({ length: pageCount }, (_, i) => i))}
                  className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
                >
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

              {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleApply}
                  disabled={isDefaultOrder}
                  loading={uploading}
                >
                  Apply new order
                </Button>
                <Button variant="ghost" onClick={reset}>Cancel</Button>
              </div>
              {isDefaultOrder && (
                <p className="mt-2 text-xs text-gray-400">Move at least one page to enable apply.</p>
              )}
            </>
          )}
        </>
      )}

      {jobId && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          {isProcessing && (
            <>
              <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              <p className="text-sm text-gray-500">Applying new page order…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Your reordered PDF is ready!</p>
              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>Download PDF</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Reorder another</Button>
              </div>
            </>
          )}

          {isFailed && (
            <>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-red-500">{job?.errorMsg ?? 'Something went wrong.'}</p>
              <Button variant="ghost" onClick={reset}>Try again</Button>
            </>
          )}
        </div>
      )}
    </PageWrapper>
  );
}
