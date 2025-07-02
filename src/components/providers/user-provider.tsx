'use client';

import type { UserRole, Carrier } from '@/types';
import React, { createContext, useState, useMemo } from 'react';

type UserContextType = {
  role: UserRole;
  setRole: (role: UserRole) => void;
  carrier?: Carrier;
  setCarrier: (carrier?: Carrier) => void;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('admin');
  const [carrier, setCarrier] = useState<Carrier | undefined>(undefined);

  const value = useMemo(() => ({
    role,
    setRole: (newRole: UserRole) => {
      setRole(newRole);
      if (newRole !== 'carrier') {
        setCarrier(undefined);
      }
    },
    carrier,
    setCarrier,
  }), [role, carrier]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}
