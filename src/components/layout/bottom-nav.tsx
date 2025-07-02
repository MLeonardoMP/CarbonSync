'use client';

import React, { useState, useEffect } from 'react';
import { GearsmapLogo } from '../icons/gearsmap-logo';

export function Footer() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    return (
        <div className="fixed bottom-2 left-2 z-50">
            <a
              href="https://gearsmap.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-md backdrop-blur-sm transition-opacity hover:opacity-100"
            >
              <span className="font-medium">Powered by</span>
              <GearsmapLogo className="h-5 w-5" />
            </a>
        </div>
    );
}
