import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

export function Merge() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => [...prev, ...incoming]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.merge(files);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFiles([]);
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper title="Merge PDFs" description="Upload two or more PDFs to combine them into one file.">
      {!jobId && (
        <>
          <UploadZone multiple onFiles={addFiles} />

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              {files.map((f, i) => (
                <FileCard
                  key={i}
                  name={f.name}
                  meta={`${(f.size / 1024 / 1024).toFixed(1)} MB`}
                  onRemove={() => removeFile(i)}
                />
              ))}
            </div>
          )}

          {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

          <div className="mt-8 flex gap-3">
            <Button onClick={handleMerge} disabled={files.length < 2} loading={uploading}>
              Merge {files.length > 0 ? `${files.length} PDFs` : 'PDFs'}
            </Button>
            {files.length > 0 && <Button variant="ghost" onClick={reset}>Clear</Button>}
          </div>

          {files.length === 1 && (
            <p className="mt-3 font-mono text-[11px] text-[var(--text-4)]">Add at least one more PDF to merge.</p>
          )}
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Merging your PDFs…"
          doneLabel="Your merged PDF is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Merge more"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
