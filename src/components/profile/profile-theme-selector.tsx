'use client';

import { useTheme } from 'next-themes';
import { useProfileStore } from '@/store/useProfileStore';
import { themes } from '@/lib/theme';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Zap, Gamepad, Eye, Circle, Square, X } from 'lucide-react';
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

export function ProfileThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useProfileStore();
  
  // Mettre à jour le thème dans le profil lorsqu'il change
  const handleThemeChange = async (value: string) => {
    setTheme(value);
    if (profile) {
      await updateProfile({ theme: value });
    }
  };
  
  // Charger le thème depuis le profil au montage du composant
  useEffect(() => {
    if (profile?.theme && profile.theme !== theme) {
      setTheme(profile.theme);
    }
  }, [profile, setTheme, theme]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thème préféré</CardTitle>
        <CardDescription>
          Choisissez votre thème préféré qui sera appliqué à chaque connexion
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={theme || 'system'} 
          onValueChange={handleThemeChange}
          className="grid grid-cols-1 md:grid-cols-2 gap-2"
        >
          {themes.map((t) => {
            const ItemIcon = icons[t.icon];
            return (
              <div key={t.value} className="flex items-center space-x-2">
                <RadioGroupItem value={t.value} id={`theme-${t.value}`} />
                <Label 
                  htmlFor={`theme-${t.value}`}
                  className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent"
                >
                  <ItemIcon className="h-4 w-4 transition-none" />
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.description}</div>
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
