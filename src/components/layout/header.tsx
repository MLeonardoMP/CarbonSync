'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserCircle, LineChart, Map, Bot, Calculator, Menu, LogOut } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import type { UserRole, Carrier } from '@/types';
import { Logo } from '@/components/icons/logo';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const carriers: Carrier[] = ['EcoHaul', 'SwiftTrans', 'AquaGlide', 'RailForward'];

const navItems = [
  { href: '/dashboard', icon: LineChart, label: 'Dashboard' },
  { href: '/geo-visor', icon: Map, label: 'Geo-Visor' },
  { href: '/route-optimizer', icon: Bot, label: 'Route Optimizer' },
  { href: '/co2-calculator', icon: Calculator, label: 'CO2 Calculator' },
];

export function Header() {
  const pathname = usePathname();
  const { role, setRole, carrier, setCarrier } = useUser();
  const [open, setOpen] = React.useState(false);

  const handleRoleChange = (newRole: string) => {
    setRole(newRole as UserRole);
    if(newRole !== 'carrier') {
        setCarrier(undefined);
    }
  };

  const handleCarrierChange = (newCarrier: string) => {
    setCarrier(newCarrier as Carrier);
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-6 w-6 text-primary" />
          <span className="hidden font-bold sm:inline-block">CarbonSync</span>
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
         <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-xs sm:max-w-xs">
                <nav className="grid gap-6 text-lg font-medium">
                  <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                    onClick={() => setOpen(false)}
                  >
                    <Logo className="h-6 w-6 text-primary" />
                    <span className="font-bold">CarbonSync</span>
                  </Link>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                          'flex items-center gap-4 px-2.5',
                          pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
         </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
                <UserCircle className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none capitalize">{role}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                        {carrier ? `${carrier} - ` : ''}{role}@carbonsync.com
                    </p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={role} onValueChange={handleRoleChange}>
              <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="analyst">Analyst</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="carrier">Carrier</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            {role === 'carrier' && (
              <>
                <DropdownMenuSeparator />
                 <DropdownMenuLabel>Switch Carrier</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={carrier || ''} onValueChange={handleCarrierChange}>
                  {carriers.map(c => (
                    <DropdownMenuRadioItem key={c} value={c}>{c}</DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
