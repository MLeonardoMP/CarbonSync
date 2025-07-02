'use client';

import { usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserCircle, ChevronDown } from 'lucide-react';
import { useUser } from '@/hooks/use-user';
import type { UserRole, Carrier } from '@/types';

const carriers: Carrier[] = ['EcoHaul', 'SwiftTrans', 'AquaGlide', 'RailForward'];

export function Header() {
  const pathname = usePathname();
  const { role, setRole, carrier, setCarrier } = useUser();
  const pageTitle =
    pathname.split('/').pop()?.replace('-', ' ') ?? 'Dashboard';

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
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 md:px-6">
      <h1 className="text-lg font-semibold capitalize md:text-xl">
        {pageTitle}
      </h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <UserCircle className="mr-2 h-4 w-4" />
            <span className="capitalize">{role}</span>
            {carrier && <span className="ml-1 text-muted-foreground">({carrier})</span>}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuRadioGroup value={role} onValueChange={handleRoleChange}>
            <DropdownMenuRadioItem value="admin">Admin</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="analyst">Analyst</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="carrier">Carrier</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          {role === 'carrier' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={carrier} onValueChange={handleCarrierChange}>
                {carriers.map(c => (
                  <DropdownMenuRadioItem key={c} value={c}>{c}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
