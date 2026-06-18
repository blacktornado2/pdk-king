import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { UploadCloud } from 'lucide-react';

interface UploadZoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}

export function UploadZone({ multiple = false, onFiles, label }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    if (files.length) onFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  const open = () => inputRef.current?.click();

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload PDF"
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onClick={open}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } }}
      className={
        'rounded-xl border-2 border-dashed bg-[var(--surface)] flex flex-col items-center justify-center ' +
        'text-center gap-4 py-20 px-6 transition-colors duration-200 cursor-pointer ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ' +
        (isDragging
          ? 'border-[var(--accent)] bg-[var(--accent-05)]'
          : 'border-[var(--border)] hover:border-[var(--accent-40)]')
      }
    >
      <div className="bg-[var(--bg)] border border-[var(--border)] p-4 rounded-lg">
        <UploadCloud className="w-8 h-8 text-[var(--accent)]" aria-hidden />
      </div>
      <p className="font-syne font-bold text-xl text-[var(--text-1)]">
        {label ?? (multiple ? 'Drop your PDFs here' : 'Drop your PDF here')}
      </p>
      <p className="text-sm text-[var(--text-2)]">
        or <span className="text-[var(--accent)] underline-offset-2 hover:underline">browse files</span>
      </p>
      <p className="font-mono text-[11px] text-[var(--text-4)]">PDF · up to 100 MB</p>
      <input ref={inputRef} type="file" accept="application/pdf" multiple={multiple}
        onChange={handleChange} className="hidden" />
    </div>
  );
}
