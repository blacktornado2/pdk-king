import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

type Quality = 'low' | 'medium' | 'high';

const QUALITY_OPTIONS: { id: Quality; label: string; description: string; tag: string }[] = [
  { id: 'low',    label: 'Low quality',    description: '72 dpi — smallest file, best for screen reading',  tag: 'Max compression' },
  { id: 'medium', label: 'Medium quality', description: '150 dpi — good balance of size and readability',   tag: 'Recommended' },
  { id: 'high',   label: 'High quality',   description: '300 dpi — light compression, good for printing',   tag: 'Best quality' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function Compress() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState<Quality>('medium');
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const meta = job?.options as Record<string, number> | null;

  const handleCompress = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.compress(file, quality);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="Compress PDF"
      description="Reduce your PDF file size. Pick a quality preset below."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : (
            <FileCard
              name={file.name}
              meta={formatBytes(file.size)}
              onRemove={() => setFile(null)}
            />
          )}

          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-3">Quality preset</p>
            <div className="space-y-3">
              {QUALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ' +
                    (quality === opt.id
                      ? 'border-[var(--accent)] bg-[var(--accent-05)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-40)]')
                  }
                  style={{ borderLeft: '3px solid var(--accent)' }}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={opt.id}
                    checked={quality === opt.id}
                    onChange={() => setQuality(opt.id)}
                    className="mt-1 accent-[var(--accent)]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-syne font-bold text-[var(--text-1)]">{opt.label}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        opt.id === 'medium'
                          ? 'bg-[var(--accent-05)] text-[var(--accent)]'
                          : 'bg-[var(--bg)] text-[var(--text-3)]'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-2)] mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

          <div className="mt-8">
            <Button onClick={handleCompress} disabled={!file} loading={uploading}>
              Compress PDF
            </Button>
          </div>
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Compressing your PDF…"
          doneLabel="Your file is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Compress another"
          onReset={reset}
          errorMsg={job.errorMsg}
          extra={
            job.status === 'DONE' ? (
              <>
                {meta?.originalSize && meta?.compressedSize && (
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl px-6 py-4 text-sm space-y-2 w-full max-w-xs font-mono">
                    <div className="flex justify-between text-[var(--text-3)]">
                      <span>Original</span>
                      <span className="text-[var(--text-2)]">{formatBytes(meta.originalSize)}</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-3)]">
                      <span>Compressed</span>
                      <span className="text-[var(--text-2)]">{formatBytes(meta.compressedSize)}</span>
                    </div>
                    <div className="border-t border-[var(--border)] pt-2 flex justify-between">
                      <span className="text-[var(--text-3)]">Saved</span>
                      <span className="font-bold text-[#22C55E]">
                        {formatBytes(meta.savedBytes)} ({meta.savedPercent}%)
                      </span>
                    </div>
                  </div>
                )}

                {meta?.savedPercent !== undefined && meta.savedPercent <= 0 && (
                  <p className="font-mono text-xs text-[var(--text-4)] max-w-xs">
                    The file couldn't be compressed further at this quality level — it may already be optimised.
                  </p>
                )}
              </>
            ) : null
          }
        />
      )}
    </PageWrapper>
  );
}
