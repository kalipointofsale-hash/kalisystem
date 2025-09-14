import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--tg-bg-color,#ffffff)]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[var(--tg-link-color,#0088cc)]" />
        <p className="text-[var(--tg-text-color,#000000)] text-lg">Loading Telegram Mini App...</p>
      </div>
    </div>
  );
};