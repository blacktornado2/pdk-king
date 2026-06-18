import { useState } from 'react';
import { Check } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { usePdfThumbnails } from '../hooks/usePdfThumbnails';
import { pdfApi, jobsApi } from '../services/api';

export function Extract() {
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { thumbnails, pageCount, loading: thumbLoading } = usePdfThumbnails(file);
  const { job } = useJobPolling(jobId);

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

  const handleExtract = async () => {
    if (!file || selected.size === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      const pages = Array.from(selected).sort((a, b) => a - b).map((i) => i + 1).join(',');
      const { data } = await pdfApi.extract(file, pages);
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
      title="Extract Pages"
      description="Pick the pages you want and download them as a new PDF."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => { setFile(f[0]); setSelected(new Set()); }} />
          ) : (
            <>
              <FileCard
                name={file.name}
                meta={`${(file.size / 1024 / 1024).toFixed(1)} MB`}
                onRemove={() => { setFile(null); setSelected(new Set()); }}
              />

              {thumbLoading && (
                <div className="flex items-center gap-2 text-sm text-[var(--text-3)] py-8 justify-center">
                  <span className="border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full w-4 h-4 animate-spin" />
                  Loading pages…
                </div>
              )}

              {!thumbLoading && thumbnails.length > 0 && (
                <>
                  <div className="flex items-center justify-between mt-6 mb-3">
                    <span className="text-xs text-[var(--text-3)]">
                      {selected.size > 0
                        ? <><span className="font-mono">{selected.size}</span> of <span className="font-mono">{pageCount}</span> selected</>
                        : <><span className="font-mono">{pageCount}</span> page{pageCount !== 1 ? 's' : ''} — click to select</>}
                    </span>
                    <button
                      onClick={toggleAll}
                      className="text-xs text-[var(--accent)] hover:text-[var(--accent-dark)] font-medium"
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
                            ? 'border-[var(--accent)] ring-2 ring-[var(--accent-40)]'
                            : 'border-[var(--border)] hover:border-[var(--accent-40)]'
                        }`}
                      >
                        <img src={src} alt={`Page ${i + 1}`} className="w-full block" />
                        <div className={`absolute inset-0 transition-colors ${
                          selected.has(i) ? 'bg-[var(--accent-05)]' : ''
                        }`} />
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black/50 text-white px-1.5 py-0.5 rounded">
                          {i + 1}
                        </span>
                        {selected.has(i) && (
                          <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--accent)] rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-[#111111]" strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {selected.size > 0 && (
                    <div className="mt-4 px-3 py-2 bg-[var(--accent-05)] border border-[var(--accent-40)] rounded-lg text-xs text-[var(--accent)]">
                      Pages selected:{' '}
                      <span className="font-mono">
                        {Array.from(selected).sort((a, b) => a - b).map((i) => i + 1).join(', ')}
                      </span>
                    </div>
                  )}

                  {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={handleExtract}
                      disabled={selected.size === 0}
                      loading={uploading}
                    >
                      Extract {selected.size > 0 ? `${selected.size} page${selected.size !== 1 ? 's' : ''}` : 'pages'}
                    </Button>
                    <Button variant="ghost" onClick={reset}>Clear</Button>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Extracting pages..."
          doneLabel="Pages extracted!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Extract from another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
