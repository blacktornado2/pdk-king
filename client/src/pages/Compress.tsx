import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
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

  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';

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
            <div className="flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
              <div>
                <span className="text-gray-700 font-medium truncate block">{file.name}</span>
                <span className="text-gray-400 text-xs">{formatBytes(file.size)}</span>
              </div>
              <button
                onClick={() => setFile(null)}
                className="ml-3 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quality preset</p>
            <div className="space-y-2">
              {QUALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    quality === opt.id
                      ? 'border-indigo-300 bg-indigo-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="quality"
                    value={opt.id}
                    checked={quality === opt.id}
                    onChange={() => setQuality(opt.id)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        opt.id === 'medium'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

          <div className="mt-6">
            <Button onClick={handleCompress} disabled={!file} loading={uploading}>
              Compress PDF
            </Button>
          </div>
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
              <p className="text-sm text-gray-500">Compressing your PDF…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              {meta?.originalSize && meta?.compressedSize && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-sm space-y-2 w-full max-w-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Original</span>
                    <span className="font-medium text-gray-700">{formatBytes(meta.originalSize)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Compressed</span>
                    <span className="font-medium text-gray-700">{formatBytes(meta.compressedSize)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between">
                    <span className="text-gray-500">Saved</span>
                    <span className="font-semibold text-emerald-600">
                      {formatBytes(meta.savedBytes)} ({meta.savedPercent}%)
                    </span>
                  </div>
                </div>
              )}

              {meta?.savedPercent !== undefined && meta.savedPercent <= 0 && (
                <p className="text-xs text-gray-400 max-w-xs">
                  The file couldn't be compressed further at this quality level — it may already be optimised.
                </p>
              )}

              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>Download PDF</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Compress another</Button>
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
