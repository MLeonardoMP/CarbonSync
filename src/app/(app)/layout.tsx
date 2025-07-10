import { Header } from '@/components/layout/header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto bg-muted/50">
        {children}
      </main>
    </div>
  );
}
