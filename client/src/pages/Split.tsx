import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { Button } from '../components/ui/Button';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi, type SplitMode } from '../services/api';

const MODES: { id: SplitMode; label: string; description: string }[] = [
  { id: 'EXTRACT', label: 'Extract pages', description: 'Pick specific pages — outputs a single PDF' },
  { id: 'RANGES', label: 'Split by ranges', description: 'One PDF per range — outputs a ZIP' },
  { id: 'EVERY_N', label: 'Split every N pages', description: 'Chunk into equal parts — outputs a ZIP' },
];

export function Split() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<SplitMode>('EXTRACT');
  const [pages, setPages] = useState('');
  const [ranges, setRanges] = useState('');
  const [n, setN] = useState('5');
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { job } = useJobPolling(jobId);

  const isProcessing = job?.status === 'PENDING' || job?.status === 'PROCESSING';
  const isDone = job?.status === 'DONE';
  const isFailed = job?.status === 'FAILED';

  const isZip = mode === 'RANGES' || mode === 'EVERY_N';
  const downloadLabel = isZip ? 'Download ZIP' : 'Download PDF';

  const canSubmit = () => {
    if (!file) return false;
    if (mode === 'EXTRACT') return pages.trim().length > 0;
    if (mode === 'RANGES') return ranges.trim().length > 0;
    if (mode === 'EVERY_N') return parseInt(n) > 0;
    return false;
  };

  const handleSplit = async () => {
    if (!file || !canSubmit()) return;
    setUploading(true);
    setUploadError(null);
    try {
      const opts =
        mode === 'EXTRACT' ? { mode, pages } :
        mode === 'RANGES' ? { mode, ranges } :
        { mode, n: parseInt(n) };

      const { data } = await pdfApi.split(file, opts);
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
    setPages('');
    setRanges('');
    setN('5');
  };

  return (
    <PageWrapper
      title="Split PDF"
      description="Extract pages, split by ranges, or divide into equal chunks."
    >
      {!jobId && (
        <>
          {!file ? (
            <UploadZone onFiles={(f) => setFile(f[0])} />
          ) : (
            <div className="flex items-center justify-between px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm">
              <span className="text-gray-700 truncate">{file.name}</span>
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
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Split mode</p>
            <div className="space-y-2">
              {MODES.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    mode === m.id
                      ? 'border-indigo-300 bg-indigo-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m.id}
                    checked={mode === m.id}
                    onChange={() => setMode(m.id)}
                    className="mt-0.5 accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-5">
            {mode === 'EXTRACT' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Page numbers
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 3, 5-7, 10"
                  value={pages}
                  onChange={(e) => setPages(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">Separate with commas. Use hyphens for ranges.</p>
              </div>
            )}

            {mode === 'RANGES' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Ranges (one PDF per range)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1-5, 6-10, 11-15"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">Each range becomes a separate PDF inside the ZIP.</p>
              </div>
            )}

            {mode === 'EVERY_N' && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Pages per chunk
                </label>
                <input
                  type="number"
                  min={1}
                  value={n}
                  onChange={(e) => setN(e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">Each chunk of this many pages becomes a PDF in the ZIP.</p>
              </div>
            )}
          </div>

          {uploadError && <p className="mt-3 text-sm text-red-500">{uploadError}</p>}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleSplit} disabled={!canSubmit()} loading={uploading}>
              Split PDF
            </Button>
            {file && <Button variant="ghost" onClick={reset}>Clear</Button>}
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
              <p className="text-sm text-gray-500">Splitting your PDF…</p>
            </>
          )}

          {isDone && (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Your file is ready!</p>
              <div className="flex gap-3">
                <a href={jobsApi.downloadUrl(jobId)}>
                  <Button>{downloadLabel}</Button>
                </a>
                <Button variant="ghost" onClick={reset}>Split another</Button>
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
