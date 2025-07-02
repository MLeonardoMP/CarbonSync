import { BottomNav } from '@/components/layout/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full">
      <main className="h-full w-full bg-muted/50">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
