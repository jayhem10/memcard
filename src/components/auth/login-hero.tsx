'use client';

import { useTheme } from 'next-themes';

export function LoginHero() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme || resolvedTheme || 'light';
  
  // Theme-specific styles
  const getThemeStyles = () => {
    switch (currentTheme) {
      case 'cyberpunk':
        return {
          container: 'bg-black relative overflow-hidden',
          overlay: 'absolute inset-0 bg-gradient-to-br from-purple-900/90 to-blue-900/70',
          title: 'text-5xl font-bold mb-6 text-yellow-300',
          description: 'text-xl text-center max-w-md text-cyan-300'
        };
      case 'retro':
        return {
          container: 'bg-amber-900 relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-amber-800/90 to-amber-950/70',
          title: 'text-5xl font-bold mb-6 text-amber-200 font-mono',
          description: 'text-xl text-center max-w-md text-amber-100 font-mono'
        };
      case 'colorblind':
        return {
          container: 'bg-slate-800 relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-slate-700/90 to-slate-900/70',
          title: 'text-5xl font-bold mb-6 text-white',
          description: 'text-xl text-center max-w-md text-white'
        };
      case 'nintendo':
        return {
          container: 'bg-red-600 relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-red-600/90 to-red-800/70',
          title: 'text-5xl font-bold mb-6 text-white',
          description: 'text-xl text-center max-w-md text-white'
        };
      case 'playstation':
        return {
          container: 'bg-blue-900 relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-blue-800/90 to-blue-950/70',
          title: 'text-5xl font-bold mb-6 text-white',
          description: 'text-xl text-center max-w-md text-gray-200'
        };
      case 'xbox':
        return {
          container: 'bg-green-800 relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-green-700/90 to-green-900/70',
          title: 'text-5xl font-bold mb-6 text-white',
          description: 'text-xl text-center max-w-md text-gray-200'
        };
      case 'dark':
        return {
          container: 'bg-gray-900 relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-gray-800/90 to-gray-950/70',
          title: 'text-5xl font-bold mb-6 text-white',
          description: 'text-xl text-center max-w-md text-gray-300'
        };
      case 'light':
      default:
        return {
          container: 'bg-primary relative',
          overlay: 'absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/50',
          title: 'text-5xl font-bold mb-6 text-primary-foreground',
          description: 'text-xl text-center max-w-md text-primary-foreground'
        };
    }
  };
  
  const styles = getThemeStyles();
  
  return (
    <div className={`hidden md:flex md:w-1/2 ${styles.container}`}>
      <div className={styles.overlay}>
        <div className="flex flex-col justify-center items-center h-full p-8">
          <h1 className={styles.title}>
            MemCard
          </h1>
          <p className={styles.description}>
            Gérez votre collection de jeux vidéo en toute simplicité
          </p>
        </div>
      </div>
    </div>
  );
}
