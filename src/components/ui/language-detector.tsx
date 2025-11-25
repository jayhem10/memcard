'use client';

import { useLanguageDetection } from '@/hooks/useLanguageDetection';

export function LanguageDetector() {
  // Ce composant déclenche la détection de langue au montage
  useLanguageDetection();
  return null; // Ne rend rien visuellement
}
