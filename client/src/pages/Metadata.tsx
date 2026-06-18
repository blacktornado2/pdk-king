import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

interface Fields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function Metadata() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<Fields>({ title: '', author: '', subject: '', keywords: '' });
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const hasAnyField = Object.values(fields).some((v) => v.trim() !== '');

  const handleSave = async () => {
    if (!file || !hasAnyField) return;
    setUploading(true);
    setUploadError(null);
    try {
      const payload: Partial<Fields> = {};
      if (fields.title.trim())    payload.title    = fields.title.trim();
      if (fields.author.trim())   payload.author   = fields.author.trim();
      if (fields.subject.trim())  payload.subject  = fields.subject.trim();
      if (fields.keywords.trim()) payload.keywords = fields.keywords.trim();
      const { data } = await pdfApi.editMetadata(file, payload);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setFields({ title: '', author: '', subject: '', keywords: '' });
    setJobId(null);
    setUploadError(null);
  };

  const field = (key: keyof Fields, label: string, placeholder: string) => (
    <Input
      label={label}
      value={fields[key]}
      onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
      placeholder={placeholder}
    />
  );

  return (
    <PageWrapper
      title="PDF Metadata Editor"
      description="Edit the title, author, subject, and keywords embedded in your PDF."
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

          {file && (
            <>
              <p className="text-xs text-[var(--text-4)] mt-4 mb-4">
                Fill in only the fields you want to update — blank fields are left unchanged.
              </p>

              <div className="space-y-4">
                {field('title',    'Title',    'e.g. Annual Report 2025')}
                {field('author',   'Author',   'e.g. Jane Smith')}
                {field('subject',  'Subject',  'e.g. Financial Summary')}
                {field('keywords', 'Keywords', 'e.g. finance, annual, report')}
              </div>

              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

              <div className="mt-6 flex gap-3">
                <Button onClick={handleSave} disabled={!hasAnyField} loading={uploading}>
                  Save Metadata
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
          processingLabel="Updating metadata..."
          doneLabel="Metadata updated!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download PDF"
          resetLabel="Edit another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
