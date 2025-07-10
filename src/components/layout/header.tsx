
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { UserCircle, Map, BarChart3, Bot, LogOut, Menu } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import type { UserRole, Carrier } from '@/types';
import { Logo } from '@/components/icons/logo';
import { GearsmapLogo } from '@/components/icons/gearsmap-logo';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

const carriers: Carrier[] = ['EcoHaul', 'SwiftTrans', 'AquaGlide', 'RailForward'];

const navItems = [
  { href: '/dashboard', icon: Map, label: 'Real Time' },
  { href: '/historical-data', icon: BarChart3, label: 'Historical Data' },
  { href: '/logistics-planner', icon: Bot, label: 'Logistics Planner' },
];

export function Header() {
  const pathname = usePathname();
  const { role, setRole, carrier, setCarrier } = useUser();
  const [isClient, setIsClient] = useState(false);
  const [isSheetOpen, setSheetOpen] = useState(false);

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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
            <div className="sm:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Toggle Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full max-w-xs">
                        <nav className="grid gap-6 text-lg font-medium">
                            <Link
                                href="/"
                                className="flex items-center gap-2 text-lg font-semibold"
                                onClick={() => setSheetOpen(false)}
                            >
                                <Logo className="h-6 w-6 text-primary" />
                                <span className="font-bold">CarbonSync</span>
                            </Link>
                            {navItems.map((item) => (
                                <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSheetOpen(false)}
                                className={cn(
                                    'flex items-center gap-4 px-2.5',
                                    pathname.startsWith(item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
            <Link
                href="/"
                className="group flex shrink-0 items-center justify-center gap-2"
            >
                <Logo className="h-6 w-6 text-primary transition-all group-hover:scale-110" />
                <span className="hidden font-bold sm:inline-block">CarbonSync</span>
            </Link>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
                <Button key={item.href} asChild variant={pathname.startsWith(item.href) ? "secondary" : "ghost"} size="sm">
                    <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                    </Link>
                </Button>
            ))}
        </div>

        <div className="flex items-center gap-2">
            {isClient && (
                <>
                    <ThemeToggle />
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <UserCircle />
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
                </>
            )}
        </div>
      </div>
    </header>
  );
}
