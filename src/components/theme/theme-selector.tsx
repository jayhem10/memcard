'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { themes } from '@/lib/theme';
import { Sun, Moon, Zap, Gamepad, Eye, Circle, Square, X } from 'lucide-react';

const icons = {
  sun: Sun,
  moon: Moon,
  zap: Zap,
  gamepad: Gamepad,
  eye: Eye,
  circle: Circle,
  square: Square,
  x: X,
};

export function ThemeSelector() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = theme || resolvedTheme || 'light';
  
  // Trouver le thème actuel dans la configuration
  const themeConfig = themes.find(t => t.value === currentTheme) || themes[0];
  const Icon = icons[themeConfig.icon];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0">
          <Icon className="h-5 w-5 transition-all" />
          <span className="sr-only">Changer de thème</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const ItemIcon = icons[t.icon];
          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={currentTheme === t.value ? 'bg-accent' : ''}
            >
              <ItemIcon className="mr-2 h-4 w-4" />
              <span>{t.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
