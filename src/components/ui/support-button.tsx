'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { SupportDialog } from './support-dialog';

interface SupportButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function SupportButton({ 
  variant = 'default', 
  size = 'default',
  className = ''
}: SupportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
    <Button
        onClick={() => setOpen(true)}
      variant={variant}
      size={size}
      className={`bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      <Heart className="h-4 w-4 mr-2 fill-current" />
      <span className=" sm:inline">Soutenir</span>
    </Button>
      <SupportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
