import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

type JobStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

interface ResultPanelProps {
  status: JobStatus;
  processingLabel: string;
  doneLabel: string;
  downloadUrl: string;
  downloadLabel: string;
  resetLabel: string;
  onReset: () => void;
  errorMsg?: string | null;
}

export function ResultPanel({
  status, processingLabel, doneLabel, downloadUrl, downloadLabel, resetLabel, onReset, errorMsg,
}: ResultPanelProps) {
  const processing = status === 'PENDING' || status === 'PROCESSING';
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      {processing && <ProgressBar label={processingLabel} />}

      {status === 'DONE' && (
        <>
          <CheckCircle2 className="w-12 h-12 text-[#22C55E]" aria-hidden />
          <p className="font-syne font-bold text-xl text-[var(--text-1)]">{doneLabel}</p>
          <div className="flex gap-3">
            <a href={downloadUrl}><Button>{downloadLabel}</Button></a>
            <Button variant="ghost" onClick={onReset}>{resetLabel}</Button>
          </div>
        </>
      )}

      {status === 'FAILED' && (
        <>
          <AlertCircle className="w-12 h-12 text-[#EF4444]" aria-hidden />
          <p className="font-mono text-sm text-[#EF4444]">{errorMsg ?? 'Something went wrong.'}</p>
          <Button variant="ghost" onClick={onReset}>Try again</Button>
        </>
      )}
    </div>
  );
}
