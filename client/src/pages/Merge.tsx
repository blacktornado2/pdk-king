import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
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

  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';
  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';

  return (
    <PageWrapper
      title="Merge PDFs"
      description="Upload two or more PDFs to combine them into one file."
    >
      {!jobId && (
        <>
          <UploadZone multiple onFiles={addFiles} />

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  <span className="text-gray-700 truncate">{f.name}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="ml-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {uploadError && (
            <p className="mt-3 text-sm text-red-500">{uploadError}</p>
          )}

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleMerge}
              disabled={files.length < 2}
              loading={uploading}
            >
              Merge {files.length > 0 ? `${files.length} PDFs` : 'PDFs'}
            </Button>
            {files.length > 0 && (
              <Button variant="ghost" onClick={reset}>
                Clear
              </Button>
            )}
          </div>

          {files.length === 1 && (
            <p className="mt-2 text-xs text-gray-400">Add at least one more PDF to merge.</p>
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
              <p className="text-sm text-gray-500">Merging your PDFs…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Your merged PDF is ready!</p>
              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>Download PDF</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Merge more</Button>
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
