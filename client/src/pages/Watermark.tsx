import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';
import { formatBytes } from '../lib/format';

const SIZE_PRESETS = [
  { label: 'Small', value: 32 },
  { label: 'Medium', value: 48 },
  { label: 'Large', value: 72 },
];

export function Watermark() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [opacity, setOpacity] = useState(0.3);
  const [fontSize, setFontSize] = useState(48);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const handleApply = async () => {
    if (!file || !text.trim()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.watermark(file, text.trim(), opacity, fontSize);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setText('');
    setOpacity(0.3);
    setFontSize(48);
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="Add Watermark"
      description="Stamp a diagonal text watermark on every page of your PDF."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : (
            <>
              <FileCard
                name={file.name}
                meta={formatBytes(file.size)}
                onRemove={() => setFile(null)}
              />

              <div className="mt-5 space-y-5">
                <Input
                  label="Watermark text"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. CONFIDENTIAL"
                />

                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-1.5">
                    Font size
                  </p>
                  <div className="flex gap-2">
                    {SIZE_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setFontSize(p.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-syne font-medium border transition-colors ${
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

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs uppercase tracking-widest text-[var(--text-3)]">Opacity</p>
                    <span className="font-mono text-xs text-[var(--text-3)]">{Math.round(opacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={80}
                    value={Math.round(opacity * 100)}
                    onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                    className="w-full accent-[var(--accent)]"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-4)] mt-1">
                    <span>Subtle</span>
                    <span>Bold</span>
                  </div>
                </div>
              </div>

              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

              <div className="mt-6 flex gap-3">
                <Button onClick={handleApply} disabled={!text.trim()} loading={uploading}>
                  Apply Watermark
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
          processingLabel="Applying watermark..."
          doneLabel="Watermark applied!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Watermark another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
