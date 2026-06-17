import { Link, useLocation } from 'react-router-dom';
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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="font-semibold text-gray-900 text-lg tracking-tight">
          PDF King
        </Link>
        <nav className="flex items-center gap-1">
          {tools.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.path}
                to={t.path}
                title={t.label}
                aria-label={t.label}
                className={`p-2 rounded-md transition-colors ${
                  pathname === t.path
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} strokeWidth={2} />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
