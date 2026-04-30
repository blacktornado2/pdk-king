import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

interface Fields {
  title: string;
  author: string;
  subject: string;
  keywords: string;
}

export function Metadata() {
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<Fields>({ title: '', author: '', subject: '', keywords: '' });
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';

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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={fields[key]}
        onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300"
      />
    </div>
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
            <>
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg mb-5">
                <svg className="w-8 h-8 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              <p className="text-xs text-gray-400 mb-4">Fill in only the fields you want to update — blank fields are left unchanged.</p>

              <div className="space-y-4">
                {field('title',    'Title',    'e.g. Annual Report 2025')}
                {field('author',   'Author',   'e.g. Jane Smith')}
                {field('subject',  'Subject',  'e.g. Financial Summary')}
                {field('keywords', 'Keywords', 'e.g. finance, annual, report')}
              </div>

              {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

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

      {jobId && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          {isProcessing && (
            <>
              <svg className="animate-spin h-8 w-8 text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
              </svg>
              <p className="text-sm text-gray-500">Saving metadata…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Metadata updated!</p>
              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>Download PDF</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Edit another</Button>
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
