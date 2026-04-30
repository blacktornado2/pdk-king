import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { usePdfThumbnails } from '../hooks/usePdfThumbnails';
import { pdfApi, jobsApi } from '../services/api';

type Degrees = 90 | 180 | 270;

const ROTATION_OPTIONS: { deg: Degrees; label: string; icon: string }[] = [
  { deg: 90,  label: '90° CW',  icon: '↻' },
  { deg: 180, label: '180°',    icon: '↕' },
  { deg: 270, label: '90° CCW', icon: '↺' },
];

export function Rotate() {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [degrees, setDegrees] = useState<Degrees>(90);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { thumbnails, pageCount, loading: thumbLoading } = usePdfThumbnails(file);
  const { job } = useJobPolling(jobId);

  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';

  const allSelected = pageCount > 0 && selected.size === pageCount;

  const togglePage = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected
      ? new Set()
      : new Set(Array.from({ length: pageCount }, (_, i) => i))
    );
  };

  const handleRotate = async () => {
    if (!file || selected.size === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const pages = allSelected
        ? 'all'
        : Array.from(selected).sort((a, b) => a - b).map((i) => i + 1).join(',');
      const { data } = await pdfApi.rotate(file, pages, degrees);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setSelected(new Set());
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="Rotate Pages"
      description="Select pages and choose a rotation angle."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => { setFile(f[0]); setSelected(new Set()); }} />
          ) : (
            <>
              {thumbLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
                  </svg>
                  Loading pages…
                </div>
              )}

              {!thumbLoading && thumbnails.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">{pageCount} page{pageCount !== 1 ? 's' : ''} — click to select</span>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {thumbnails.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => togglePage(i)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                          selected.has(i)
                            ? 'border-indigo-500 ring-2 ring-indigo-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img src={src} alt={`Page ${i + 1}`} className="w-full block" />
                        <div className={`absolute inset-0 transition-colors ${
                          selected.has(i) ? 'bg-indigo-500/10' : ''
                        }`} />
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium bg-black/50 text-white px-1.5 py-0.5 rounded">
                          {i + 1}
                        </span>
                        {selected.has(i) && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Rotation</p>
                    <div className="flex gap-2">
                      {ROTATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.deg}
                          onClick={() => setDegrees(opt.deg)}
                          className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                            degrees === opt.deg
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-lg leading-none mr-1">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleRotate}
                      disabled={selected.size === 0}
                      loading={uploading}
                    >
                      Rotate {selected.size > 0 ? `${selected.size} page${selected.size !== 1 ? 's' : ''}` : 'pages'}
                    </Button>
                    <Button variant="ghost" onClick={reset}>Clear</Button>
                  </div>
                </>
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
              <p className="text-sm text-gray-500">Rotating pages…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Pages rotated!</p>
              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>Download PDF</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Rotate another</Button>
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
