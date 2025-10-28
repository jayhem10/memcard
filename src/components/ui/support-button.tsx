'use client';

import { Button } from '@/components/ui/button';
import { Heart, ExternalLink } from 'lucide-react';

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
  const handleSupportClick = () => {
    window.open('https://ko-fi.com/jayhem10', '_blank', 'noopener,noreferrer');
  };

  return (
    <Button
      onClick={handleSupportClick}
      variant={variant}
      size={size}
      className={`bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
    >
      <Heart className="h-4 w-4 mr-2 fill-current" />
      <span className="hidden sm:inline">Soutenir</span>
      <ExternalLink className="h-3 w-3 ml-1" />
    </Button>
  );
}
