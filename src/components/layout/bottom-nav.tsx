
'use client';

import React, { useState, useEffect } from 'react';
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
import { UserCircle, Map, Bot, LogOut, Calculator, Route } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import type { UserRole, Carrier } from '@/types';
import { Logo } from '@/components/icons/logo';
import { ThemeToggle } from './theme-toggle';
import { GearsmapLogo } from '../icons/gearsmap-logo';

const carriers: Carrier[] = ['EcoHaul', 'SwiftTrans', 'AquaGlide', 'RailForward'];

const navItems = [
  { href: '/dashboard', icon: Map, label: 'Dashboard' },
  { href: '/logistics-planner', icon: Bot, label: 'Logistics Planner' },
  { href: '/co2-calculator', icon: Calculator, label: 'CO2 Calculator' },
  { href: '/route-optimizer', icon: Route, label: 'Route Optimizer' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { role, setRole, carrier, setCarrier } = useUser();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


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
    <footer className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="group flex shrink-0 items-center justify-center gap-2"
          >
            <Logo className="h-6 w-6 text-primary transition-all group-hover:scale-110" />
            <span className="hidden font-bold sm:inline-block">CarbonSync</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            {navItems.map((item) => (
                <Button key={item.href} asChild variant={pathname.startsWith(item.href) ? "secondary" : "ghost"} size="sm">
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                </Button>
            ))}
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="flex sm:hidden items-center gap-2">
            {navItems.map((item) => (
                 <Button key={item.href} asChild variant={pathname.startsWith(item.href) ? "secondary" : "ghost"} size="icon">
                    <Link href={item.href}>
                        <item.icon />
                        <span className="sr-only">{item.label}</span>
                    </Link>
                </Button>
            ))}
        </div>

        <div className="flex items-center gap-4">
          {isClient && (
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <a
                href="https://gearsmap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100"
              >
                <span className="font-medium">Powered by</span>
                <GearsmapLogo className="h-5 w-5" />
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <UserCircle />
                    <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" side="top">
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
        </div>
      </div>
    </footer>
  );
}
