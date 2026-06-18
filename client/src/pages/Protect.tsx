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

export function Protect() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = !!file && password.length > 0 && password === confirm;

  const handleProtect = async () => {
    if (!canSubmit) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.protect(file!, password);
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
    setConfirm('');
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="Protect PDF"
      description="Add password protection to a PDF. Anyone opening it will need this password."
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

          <div className="mt-5 space-y-4">
            <Input
              label="Set Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Re-enter the password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleProtect()}
              error={mismatch ? 'Passwords do not match.' : undefined}
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
            <Button onClick={handleProtect} disabled={!canSubmit} loading={uploading}>
              Protect PDF
            </Button>
          </div>
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Encrypting your PDF..."
          doneLabel="PDF protected successfully!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Protect another"
          onReset={reset}
          errorMsg={job.errorMsg}
          extra={
            <p className="text-xs text-[var(--text-4)] max-w-xs">
              Keep your password safe — it cannot be recovered from the file.
            </p>
          }
        />
      )}
    </PageWrapper>
  );
}
