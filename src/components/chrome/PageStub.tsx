export function PageStub({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main id="main" className="page-stub">
      <h1 className="text-display">{title}</h1>
      {children}
    </main>
  );
}
