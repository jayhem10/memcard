'use client';

import { useTheme } from 'next-themes';
import { useProfile } from '@/store';
import { themes } from '@/lib/theme';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, Zap, Gamepad, Sword, Circle, Square, X } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

const icons = {
  sun: Sun,
  moon: Moon,
  zap: Zap,
  gamepad: Gamepad,
  sword: Sword,
  circle: Circle,
  square: Square,
  x: X,
};

export function ProfileThemeSelector() {
  const t = useTranslations('profile');
  const themeTranslations = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const { profile, updateProfile } = useProfile();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Mettre à jour le thème dans le profil lorsqu'il change
  const handleThemeChange = async (value: string) => {
    // Mettre à jour le thème local immédiatement pour l'effet visuel
    setTheme(value);
    
    // Mettre à jour le profil en base de données
    if (profile) {
      try {
        await updateProfile({ theme: value });
        toast.success(t('profileUpdated'));
        // Marquer que le thème du profil a été appliqué pour cette session
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('profileThemeApplied', 'true');
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du thème:', error);
        // En cas d'erreur, remettre le thème précédent
        setTheme(profile.theme || 'system');
      }
    }
  };
  
  // Charger le thème depuis le profil UNIQUEMENT au premier chargement de l'application
  // Ne jamais réappliquer automatiquement pour éviter les changements non désirés
  useEffect(() => {
    // Ne rien faire si le profil n'est pas encore chargé ou n'a pas de thème défini
    if (!mounted || !profile || !profile.theme) return;
    
    // Vérifier si le thème du profil a déjà été appliqué dans cette session
    const themeAlreadyApplied = typeof window !== 'undefined' 
      ? sessionStorage.getItem('profileThemeApplied') === 'true'
      : false;
    
    // Ne réappliquer le thème que si :
    // 1. Le thème n'a pas encore été appliqué dans cette session
    // 2. Le thème actuel est différent du thème du profil
    // 3. Le thème actuel n'est pas déjà celui du profil (pour éviter les changements inutiles)
    if (!themeAlreadyApplied && theme !== profile.theme) {
      setTheme(profile.theme);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('profileThemeApplied', 'true');
      }
    }
  }, [profile, profile?.theme, mounted, setTheme, theme]);

  if (!mounted) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{themeTranslations('preferredTheme')}</CardTitle>
        <CardDescription>
          {themeTranslations('chooseTheme')}
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
                  className="flex items-center gap-2 cursor-pointer p-2 rounded transition-all duration-200 hover:bg-accent hover:text-accent-foreground group"
                >
                  <ItemIcon className="h-4 w-4 transition-colors group-hover:text-accent-foreground" />
                  <div>
                    <div className="font-medium transition-colors group-hover:text-accent-foreground">{themeTranslations(t.value)}</div>
                    <div className="text-xs text-muted-foreground transition-colors group-hover:text-accent-foreground group-hover:opacity-90">{themeTranslations(`descriptions.${t.value}`)}</div>
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
