import { Header } from '@/components/layout/header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-background p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
