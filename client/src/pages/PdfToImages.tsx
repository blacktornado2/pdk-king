import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi } from '../services/api';

type Format = 'jpeg' | 'png';

export function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<Format>('jpeg');
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';

  const handleConvert = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { data } = await pdfApi.toImages(file, format);
      setJobId(data.jobId);
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setFormat('jpeg');
    setJobId(null);
    setUploadError(null);
  };

  return (
    <PageWrapper
      title="PDF to Images"
      description="Convert every page of your PDF into JPEG or PNG images, bundled in a ZIP."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : (
            <>
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <svg className="w-8 h-8 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Output format</p>
                <div className="flex gap-2">
                  {(['jpeg', 'png'] as Format[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        format === f
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {format === 'jpeg' ? 'Smaller file size, ideal for photos' : 'Lossless quality, supports transparency'}
                </p>
              </div>

              {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

              <div className="mt-6 flex gap-3">
                <Button onClick={handleConvert} loading={uploading}>
                  Convert to {format.toUpperCase()}
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
              <p className="text-sm text-gray-500">Converting pages to images…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Images ready!</p>
              <p className="text-xs text-gray-400">ZIP contains one image per page</p>
              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>Download ZIP</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Convert another</Button>
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
