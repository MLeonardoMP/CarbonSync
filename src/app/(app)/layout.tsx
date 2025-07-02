import { Header } from '@/components/layout/header';
import { MainSidebar } from '@/components/layout/main-sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full">
      <MainSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto bg-muted/5">
            {children}
        </main>
      </div>
    </div>
  );
}
