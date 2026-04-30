import { Link, useLocation } from 'react-router-dom';

const tools = [
  { path: '/merge', label: 'Merge' },
  { path: '/split', label: 'Split' },
  { path: '/reorder', label: 'Reorder' },
  { path: '/compress', label: 'Compress' },
  { path: '/unlock', label: 'Unlock' },
  { path: '/protect', label: 'Protect' },
  { path: '/rotate', label: 'Rotate' },
  { path: '/extract', label: 'Extract' },
  { path: '/to-images', label: 'To Images' },
  { path: '/watermark',     label: 'Watermark' },
  { path: '/page-numbers',  label: 'Page Numbers' },
  { path: '/metadata',      label: 'Metadata' },
  { path: '/edit',          label: 'Edit Text' },
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
          {tools.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === t.path
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
