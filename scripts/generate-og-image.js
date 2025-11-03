/**
 * Script pour générer une image Open Graph améliorée avec texte stylisé
 * Format: 1200x630px
 * Style: Logo "MemCard" stylisé avec icône de manette
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const svgPath = path.join(publicDir, 'favicon.svg');
const outputPath = path.join(publicDir, 'memcard.png');

// Créer un SVG avec le texte stylisé MemCard
const createMemCardSVG = () => {
  return `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <!-- Fond dégradé -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366f1;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Fond -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Motif de fond subtil -->
  <circle cx="200" cy="150" r="100" fill="#7c3aed" opacity="0.1"/>
  <circle cx="1000" cy="480" r="150" fill="#6366f1" opacity="0.1"/>
  
  <!-- Icône de manette (centrée à gauche) -->
  <g transform="translate(200, 315)">
    <g transform="scale(2.5)">
      <path d="M8,13 L9.5,13 C9.77614237,13 10,13.2238576 10,13.5 C10,13.7761424 9.77614237,14 9.5,14 L8,14 L8,15.5 C8,15.7761424 7.77614237,16 7.5,16 C7.22385763,16 7,15.7761424 7,15.5 L7,14 L5.5,14 C5.22385763,14 5,13.7761424 5,13.5 C5,13.2238576 5.22385763,13 5.5,13 L7,13 L7,11.5 C7,11.2238576 7.22385763,11 7.5,11 C7.77614237,11 8,11.2238576 8,11.5 L8,13 Z M10.6115614,8.9875078 C10.575689,8.99568276 10.5383486,9 10.5,9 C10.4616514,9 10.424311,8.99568276 10.3884386,8.9875078 L4.5,8.9875078 C3.67157288,8.9875078 3,9.65908068 3,10.4875078 L3,16.5 C3,17.3284271 3.67157288,18 4.5,18 L19.5069105,18 C20.3353377,18 21.0069105,17.3284271 21.0069105,16.5 L21.0069105,10.4875078 C21.0069105,9.65908068 20.3353377,8.9875078 19.5069105,8.9875078 L10.6115614,8.9875078 Z M10,7.9875078 L10,7 C10,5.8954305 10.8954305,5 12,5 C12.5522847,5 13,4.55228475 13,4 L13,3.5 C13,3.22385763 13.2238576,3 13.5,3 C13.7761424,3 14,3.22385763 14,3.5 L14,4 C14,5.1045695 13.1045695,6 12,6 C11.4477153,6 11,6.44771525 11,7 L11,7.9875078 L19.5069105,7.9875078 C20.8876224,7.9875078 22.0069105,9.10679593 22.0069105,10.4875078 L22.0069105,16.5 C22.0069105,17.8807119 20.8876224,19 19.5069105,19 L4.5,19 C3.11928813,19 2,17.8807119 2,16.5 L2,10.4875078 C2,9.10679593 3.11928813,7.9875078 4.5,7.9875078 L10,7.9875078 Z M13.5,11 L14.5,11 C14.7761424,11 15,11.2238576 15,11.5 L15,12.5 C15,12.7761424 14.7761424,13 14.5,13 L13.5,13 C13.2238576,13 13,12.7761424 13,12.5 L13,11.5 C13,11.2238576 13.2238576,11 13.5,11 Z M16.5,11 L17.5,11 C17.7761424,11 18,11.2238576 18,11.5 L18,12.5 C18,12.7761424 17.7761424,13 17.5,13 L16.5,13 C16.2238576,13 16,12.7761424 16,12.5 L16,11.5 C16,11.2238576 16.2238576,11 16.5,11 Z M17.5,14 L18.5,14 C18.7761424,14 19,14.2238576 19,14.5 L19,15.5 C19,15.7761424 18.7761424,16 18.5,16 L17.5,16 C17.2238576,16 17,15.7761424 17,15.5 L17,14.5 C17,14.2238576 17.2238576,14 17.5,14 Z M14.5,14 L15.5,14 C15.7761424,14 16,14.2238576 16,14.5 L16,15.5 C16,15.7761424 15.7761424,16 15.5,16 L14.5,16 C14.2238576,16 14,15.7761424 14,15.5 L14,14.5 C14,14.2238576 14.2238576,14 14.5,14 Z" 
        fill="white" 
        opacity="0.9"
        filter="url(#glow)"/>
    </g>
  </g>
  
  <!-- Texte MemCard stylisé -->
  <g transform="translate(550, 250)">
    <!-- MemCard - Style moderne et élégant -->
    <text x="0" y="0" 
          font-family="'Arial', sans-serif" 
          font-size="72" 
          font-weight="bold" 
          fill="white" 
          letter-spacing="-2">
      MemCard
    </text>
    
    <!-- Sous-titre -->
    <text x="0" y="50" 
          font-family="'Arial', sans-serif" 
          font-size="28" 
          fill="rgba(255,255,255,0.9)" 
          font-weight="300"
          letter-spacing="2">
      Votre bibliothèque de jeux vidéo
    </text>
  </g>
</svg>
  `.trim();
};

async function generateOGImage() {
  console.log('🎨 Génération de l\'image Open Graph améliorée...\n');
  
  try {
    // Créer le SVG avec texte stylisé
    const memCardSVG = createMemCardSVG();
    
    // Convertir SVG en PNG
    await sharp(Buffer.from(memCardSVG))
      .resize(1200, 630)
      .png()
      .toFile(outputPath);
    
    console.log('✅ Créé: memcard.png (1200x630)');
    console.log('   Design amélioré avec texte "MemCard" stylisé');
    console.log('   Fond dégradé violet moderne');
    console.log('   Icône de manette intégrée\n');
    
    console.log('💡 Note: Pour un design encore plus professionnel,');
    console.log('   vous pouvez utiliser Figma ou Canva pour créer');
    console.log('   une version personnalisée avec votre logo.\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Alternative: Utilisez un outil en ligne comme');
    console.error('   - https://www.canva.com/ (template Facebook Post)');
    console.error('   - https://www.figma.com/');
    console.error('   - https://og-image.vercel.app/\n');
  }
}

generateOGImage();

