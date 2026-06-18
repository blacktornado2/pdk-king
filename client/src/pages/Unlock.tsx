import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';
import { formatBytes } from '../lib/format';

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
            <Input
              label="PDF Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter the PDF password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              trailingIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
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
