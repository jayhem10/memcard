'use client';

import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { themes } from '@/lib/theme';
import { Sun, Moon, Zap, Gamepad, Eye, Circle, Square, X } from 'lucide-react';
import * as React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useProfileStore } from '@/store/useProfileStore';
import { useEffect } from 'react';

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
  const { profile } = useProfileStore();
  const currentTheme = theme || resolvedTheme || 'light';
  
  // Charger le thème depuis le profil si disponible
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      setTheme(profile.theme);
    }
  }, [profile, setTheme, theme]);
  
  // Trouver le thème actuel dans la configuration
  const themeConfig = themes.find(t => t.value === currentTheme) || themes[0];
  const Icon = icons[themeConfig.icon];
  
  // Utiliser un Popover au lieu d'un DropdownMenu pour plus de contrôle sur le style
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 px-0">
          <Icon className="h-5 w-5" />
          <span className="sr-only">Changer de thème</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="end">
        <div className="grid gap-1">
          {themes.map((t) => {
            const ItemIcon = icons[t.icon];
            const isActive = currentTheme === t.value;
            
            return (
              <Button
                key={t.value}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 font-normal"
                onClick={() => {
                  setTheme(t.value);
                  // Si l'utilisateur est connecté, mettre à jour son thème préféré
                  if (profile) {
                    useProfileStore.getState().updateProfile({ theme: t.value });
                  }
                }}
              >
                <ItemIcon className="h-4 w-4" />
                <span>{t.name}</span>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
