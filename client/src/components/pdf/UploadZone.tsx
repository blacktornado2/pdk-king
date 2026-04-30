import { useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface UploadZoneProps {
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
}

export function UploadZone({ multiple = false, onFiles, label }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf',
    );
    if (files.length) onFiles(files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    e.target.value = '';
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className="group border-2 border-dashed border-gray-200 rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors hover:border-indigo-400 hover:bg-indigo-50/30"
    >
      <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
        <svg className="w-6 h-6 text-gray-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          {label ?? (multiple ? 'Drop PDF files here' : 'Drop a PDF file here')}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">or click to browse — PDF only, max 100 MB</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
