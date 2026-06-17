import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function Unlock() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const handleUnlock = async () => {
    if (!file || !password) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.unlock(file, password);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPassword('');
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="Unlock PDF"
      description="Remove password protection from a PDF. You must know the current password."
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

          <div className="mt-5">
            <label className="block text-xs uppercase tracking-widest text-[var(--text-3)] mb-1.5">
              PDF Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter the PDF password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                aria-label="PDF Password"
                className="w-full bg-[var(--bg)] rounded-lg px-4 py-3 pr-10 text-[var(--text-1)] placeholder-[var(--text-3)] focus:outline-none transition-colors border border-[var(--border)] focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

          <div className="mt-6">
            <Button onClick={handleUnlock} disabled={!file || !password} loading={uploading}>
              Unlock PDF
            </Button>
          </div>
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Unlocking your PDF…"
          doneLabel="PDF unlocked successfully!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Unlock another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
