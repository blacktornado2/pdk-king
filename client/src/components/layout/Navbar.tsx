import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Combine,
  Scissors,
  ArrowUpDown,
  Shrink,
  LockOpen,
  Lock,
  RotateCw,
  FileOutput,
  Images,
  Droplets,
  Hash,
  Info,
  PencilLine,
  type LucideIcon,
} from 'lucide-react';

const tools: { path: string; label: string; icon: LucideIcon }[] = [
  { path: '/merge', label: 'Merge', icon: Combine },
  { path: '/split', label: 'Split', icon: Scissors },
  { path: '/reorder', label: 'Reorder', icon: ArrowUpDown },
  { path: '/compress', label: 'Compress', icon: Shrink },
  { path: '/unlock', label: 'Unlock', icon: LockOpen },
  { path: '/protect', label: 'Protect', icon: Lock },
  { path: '/rotate', label: 'Rotate', icon: RotateCw },
  { path: '/extract', label: 'Extract', icon: FileOutput },
  { path: '/to-images', label: 'To Images', icon: Images },
  { path: '/watermark', label: 'Watermark', icon: Droplets },
  { path: '/page-numbers', label: 'Page Numbers', icon: Hash },
  { path: '/metadata', label: 'Metadata', icon: Info },
  { path: '/edit', label: 'Edit Text', icon: PencilLine },
];

export function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={
        'fixed top-0 left-0 w-full z-50 transition-all duration-300 ' +
        (scrolled
          ? 'bg-[var(--bg-95)] backdrop-blur-sm border-b border-[var(--border)]'
          : 'bg-transparent')
      }
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
        <Link to="/" className="font-syne font-bold text-lg text-[var(--text-1)] hover:text-[var(--accent)] transition-colors">
          PDF <span className="text-[var(--accent)]">King</span>
        </Link>
        <nav className="flex items-center gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = pathname === t.path;
            return (
              <Link
                key={t.path}
                to={t.path}
                title={t.label}
                aria-label={t.label}
                className={
                  'p-2 rounded-md transition-colors ' +
                  (active
                    ? 'text-[var(--accent)] bg-[var(--accent-10)]'
                    : 'text-[var(--text-3)] hover:text-[var(--text-1)] hover:bg-[var(--surface)]')
                }
              >
                <Icon size={18} strokeWidth={2} aria-hidden />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
