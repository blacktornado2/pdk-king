import { Link } from 'react-router-dom';
import {
  Combine, Scissors, ArrowUpDown, Shrink, LockOpen, Lock, RotateCw,
  FileOutput, Images, Droplets, Hash, Info, PencilLine, type LucideIcon,
} from 'lucide-react';
import { ToolCard } from '../components/ui/ToolCard';
import { Button } from '../components/ui/Button';

const tools: { path: string; label: string; description: string; icon: LucideIcon }[] = [
  { path: '/merge', label: 'Merge PDFs', description: 'Combine multiple PDFs into one file, in any order.', icon: Combine },
  { path: '/split', label: 'Split PDF', description: 'Extract pages or split by range.', icon: Scissors },
  { path: '/reorder', label: 'Reorder Pages', description: 'Drag and drop pages into any order.', icon: ArrowUpDown },
  { path: '/compress', label: 'Compress PDF', description: 'Reduce file size without losing quality.', icon: Shrink },
  { path: '/unlock', label: 'Unlock PDF', description: 'Remove password protection from a PDF.', icon: LockOpen },
  { path: '/protect', label: 'Protect PDF', description: 'Password-protect your PDF with AES encryption.', icon: Lock },
  { path: '/rotate', label: 'Rotate Pages', description: 'Rotate pages by 90, 180, or 270°.', icon: RotateCw },
  { path: '/extract', label: 'Extract Pages', description: 'Pick specific pages and save them as a new PDF.', icon: FileOutput },
  { path: '/to-images', label: 'PDF to Images', description: 'Convert every page to JPEG or PNG, bundled as a ZIP.', icon: Images },
  { path: '/watermark', label: 'Add Watermark', description: 'Stamp diagonal text on every page.', icon: Droplets },
  { path: '/page-numbers', label: 'Add Page Numbers', description: 'Stamp page numbers at any position.', icon: Hash },
  { path: '/metadata', label: 'Metadata Editor', description: 'Edit title, author, subject, and keywords.', icon: Info },
  { path: '/edit', label: 'Edit PDF Text', description: 'Click any text and type a replacement.', icon: PencilLine },
];

const STEPS = [
  { n: '01', label: 'Upload' },
  { n: '02', label: 'Choose Tool' },
  { n: '03', label: 'Download' },
];

export function Home() {
  return (
    <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-40 pb-24">
      <section className="max-w-2xl">
        <h1 className="font-syne font-bold text-5xl lg:text-7xl leading-tight text-[var(--text-1)]">
          PDF tools that just work.
        </h1>
        <p className="mt-6 text-lg text-[var(--text-2)] leading-relaxed">
          Merge, split, reorder, compress, and unlock PDFs — fast, private, and free.
        </p>
        <div className="mt-8">
          <Link to="/merge"><Button>Get started</Button></Link>
        </div>
      </section>

      <section className="mt-20 flex flex-wrap gap-x-10 gap-y-3" aria-label="How it works">
        {STEPS.map((s) => (
          <p key={s.n} className="font-syne font-bold text-lg">
            <span className="text-[var(--accent)]">{s.n}</span>
            <span className="text-[var(--text-3)]"> — </span>
            <span className="text-[var(--text-1)]">{s.label}</span>
          </p>
        ))}
      </section>

      <section className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((t, i) => (
          <ToolCard key={t.path} to={t.path} title={t.label} description={t.description} Icon={t.icon} index={i % 3} />
        ))}
      </section>
    </main>
  );
}
