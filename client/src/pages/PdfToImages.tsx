import { useState } from 'react';
import { PageWrapper } from '../components/layout/PageWrapper';
import { UploadZone } from '../components/pdf/UploadZone';
import { FileCard } from '../components/pdf/FileCard';
import { ResultPanel } from '../components/pdf/ResultPanel';
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
              <FileCard
                name={file.name}
                meta={`${(file.size / 1024).toFixed(1)} KB`}
                onRemove={() => setFile(null)}
              />

              <div className="mt-5">
                <p className="text-xs uppercase tracking-widest text-[var(--text-3)] mb-3">Output format</p>
                <div className="flex gap-2">
                  {(['jpeg', 'png'] as Format[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        format === f
                          ? 'border-[var(--accent)] bg-[var(--accent-05)] text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)] hover:border-[var(--accent-40)]'
                      }`}
                    >
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-[var(--text-3)]">
                  {format === 'jpeg' ? 'Smaller file size, ideal for photos' : 'Lossless quality, supports transparency'}
                </p>
              </div>

              {uploadError && <p className="mt-3 font-mono text-sm text-[#EF4444]">{uploadError}</p>}

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

      {jobId && job && (
        <ResultPanel
          status={job.status}
          processingLabel="Converting to images..."
          doneLabel="Images ready!"
          downloadUrl={jobsApi.downloadUrl(jobId)}
          downloadLabel="Download ZIP"
          resetLabel="Convert another"
          onReset={reset}
          errorMsg={job.errorMsg}
          extra={<p className="font-mono text-xs text-[var(--text-3)]">ZIP contains one image per page</p>}
        />
      )}
    </PageWrapper>
  );
}
