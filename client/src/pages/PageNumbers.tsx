import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

type Position = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center' | 'top-left' | 'top-right';

const POSITIONS: { value: Position; label: string }[] = [
  { value: 'bottom-left',   label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right',  label: 'Bottom Right' },
  { value: 'top-left',      label: 'Top Left' },
  { value: 'top-center',    label: 'Top Center' },
  { value: 'top-right',     label: 'Top Right' },
];

const SIZE_PRESETS = [
  { label: 'Small',  value: 10 },
  { label: 'Medium', value: 12 },
  { label: 'Large',  value: 16 },
];

export function PageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [startFrom, setStartFrom] = useState(1);
  const [fontSize, setFontSize] = useState(12);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const handleApply = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.addPageNumbers(file, position, startFrom, fontSize);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPosition('bottom-center');
    setStartFrom(1);
    setFontSize(12);
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="Add Page Numbers"
      description="Stamp page numbers onto every page at your chosen position."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : (
            <>
              <FileCard
                name={file.name}
                meta={`${(file.size / 1024).toFixed(1)} KB`}
                onRemove={() => setFile(null)}
              />

              <div className="space-y-5 mt-5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-2">Position</p>
                  <div className="grid grid-cols-3 gap-2">
                    {POSITIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setPosition(p.value)}
                        className={`font-syne py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          position === p.value
                            ? 'border-[var(--accent)] bg-[var(--accent-05)] text-[var(--accent)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:border-[var(--accent-40)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-2">Font size</p>
                  <div className="flex gap-2">
                    {SIZE_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setFontSize(p.value)}
                        className={`font-syne px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          fontSize === p.value
                            ? 'border-[var(--accent)] bg-[var(--accent-05)] text-[var(--accent)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:border-[var(--accent-40)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Start numbering from"
                  type="number"
                  min={1}
                  value={startFrom}
                  onChange={(e) => setStartFrom(Math.max(1, Number(e.target.value)))}
                  className="w-24"
                />
              </div>

              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

              <div className="mt-6 flex gap-3">
                <Button onClick={handleApply} loading={uploading}>
                  Add Page Numbers
                </Button>
                <Button variant="ghost" onClick={reset}>Clear</Button>
              </div>
            </>
          )}
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Adding page numbers..."
          doneLabel="Page numbers added!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Number another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
