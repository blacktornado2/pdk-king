interface PageWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, description, children }: PageWrapperProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h1>
      <p className="mt-1 text-gray-500 text-sm">{description}</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}
