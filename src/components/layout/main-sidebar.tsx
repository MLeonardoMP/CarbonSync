'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LineChart, Map, Bot, UserCircle, LogOut, Calculator } from 'lucide-react';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/hooks/use-user';

const navItems = [
  { href: '/dashboard', icon: LineChart, label: 'Dashboard' },
  { href: '/geo-visor', icon: Map, label: 'Geo-Visor' },
  { href: '/route-optimizer', icon: Bot, label: 'Route Optimizer' },
  { href: '/co2-calculator', icon: Calculator, label: 'CO2 Calculator' },
];

export function MainSidebar() {
  const pathname = usePathname();
  const { role, carrier } = useUser();

  return (
    <aside className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-primary" />
          <span>CarbonSync</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <div className="flex h-full flex-col justify-between">
          <ul className="grid items-start gap-1 px-4">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    pathname === item.href
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto p-4">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex w-full justify-start gap-3 px-3 py-2 text-left">
                  <UserCircle className="h-5 w-5" />
                  <div className="flex flex-col items-start">
                     <span className="text-sm font-medium capitalize">{role}</span>
                     {carrier && <span className="text-xs text-muted-foreground">{carrier}</span>}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none capitalize">{role}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {role}@carbonsync.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>
    </aside>
  );
}
