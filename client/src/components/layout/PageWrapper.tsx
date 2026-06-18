interface PageWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function PageWrapper({ title, description, children }: PageWrapperProps) {
  return (
    <main className="max-w-3xl mx-auto px-6 lg:px-12 pt-32 pb-24">
      <h1 className="font-syne font-bold text-4xl text-[var(--text-1)]">{title}</h1>
      <p className="mt-3 text-[var(--text-2)] text-sm leading-relaxed">{description}</p>
      <div className="mt-10">{children}</div>
    </main>
  );
}
