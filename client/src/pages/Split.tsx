import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useJobPolling } from '../hooks/useJobPolling';
import { pdfApi, jobsApi, type SplitMode } from '../services/api';
import { formatBytes } from '../lib/format';

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
            <FileCard
              name={file.name}
              meta={formatBytes(file.size)}
              onRemove={() => setFile(null)}
            />
          )}

          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-3">Split mode</p>
            <div className="space-y-3">
              {MODES.map((m) => (
                <label key={m.id}
                  className={
                    'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ' +
                    (mode === m.id
                      ? 'border-[var(--accent)] bg-[var(--accent-05)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-40)]')
                  }
                  style={{ borderLeft: '3px solid var(--accent)' }}
                >
                  <input type="radio" name="mode" value={m.id} checked={mode === m.id}
                    onChange={() => setMode(m.id)} className="mt-1 accent-[var(--accent)]" />
                  <div>
                    <p className="font-syne font-bold text-[var(--text-1)]">{m.label}</p>
                    <p className="text-sm text-[var(--text-2)]">{m.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            {mode === 'EXTRACT' && (
              <Input label="Page numbers" placeholder="e.g. 1, 3, 5-7, 10"
                value={pages} onChange={(e) => setPages(e.target.value)}
                hint="Separate with commas. Use hyphens for ranges." />
            )}
            {mode === 'RANGES' && (
              <Input label="Ranges (one PDF per range)" placeholder="e.g. 1-5, 6-10, 11-15"
                value={ranges} onChange={(e) => setRanges(e.target.value)}
                hint="Each range becomes a separate PDF inside the ZIP." />
            )}
            {mode === 'EVERY_N' && (
              <Input label="Pages per chunk" type="number" min={1} className="w-40"
                value={n} onChange={(e) => setN(e.target.value)}
                hint="Each chunk of this many pages becomes a PDF in the ZIP." />
            )}
          </div>

          {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

          <div className="mt-8 flex gap-3">
            <Button onClick={handleSplit} disabled={!canSubmit()} loading={uploading}>Split PDF</Button>
            {file && <Button variant="ghost" onClick={reset}>Clear</Button>}
          </div>
        </>
      )}

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Splitting your PDF…"
          doneLabel="Your file is ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel={downloadLabel}
          resetLabel="Split another"
          onReset={reset}
          errorMsg={job.errorMsg}
        />
      )}
    </PageWrapper>
  );
}
