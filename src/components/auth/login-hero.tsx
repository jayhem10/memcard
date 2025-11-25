'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import './login-hero.css';

interface Shape {
  x: number;
  y: number;
  size: number;
  speed: number;
  type: 'psCircle' | 'psTriangle' | 'psSquare' | 'psCross' | 'buttonA' | 'buttonB';
  opacity: number;
  rotation: number;
  rotationSpeed: number;
}

function MatrixShapes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create shapes
    const shapes: Shape[] = [];
    const numberOfShapes = 12;
    
    for (let i = 0; i < numberOfShapes; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: 28,
        speed: Math.random() * 1.0 + 0.15,
        type: (['psCircle', 'psTriangle', 'psSquare', 'psCross', 'buttonA', 'buttonB'][Math.floor(Math.random() * 6)] as Shape['type']),
        opacity: Math.random() * 0.2 + 0.25,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01
      });
    }
    
    // Draw shapes
    const drawShape = (shape: Shape) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = shape.opacity;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const r = shape.size / 2;
      const symbolRadius = r * 0.50; // plus de padding interne
      const symbolStroke = Math.max(2, r * 0.14); // symbole un peu plus fin
      
      switch (shape.type) {
        case 'psCircle': {
          const color = '#D83C3C'; // Rouge (O)
          // Anneau blanc externe pour contraste
          ctx.beginPath();
          ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
          // Bouton coloré
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(216, 60, 60, 0.18)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Symbole: cercle centré avec plus de marge et trait plus fin
          ctx.beginPath();
          ctx.arc(0, 0, symbolRadius, 0, Math.PI * 2);
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.max(1.5, r * 0.12);
          ctx.stroke();
          break;
        }
        case 'psTriangle': {
          const color = '#22C55E'; // Vert (△)
          // Anneau blanc externe
          ctx.beginPath();
          ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
          // Bouton coloré
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Symbole: triangle équilatéral inscrit (avec léger padding)
          const triR = symbolRadius * 1.05;
          const a1 = -Math.PI / 2; // sommet en haut
          const a2 = a1 + (2 * Math.PI) / 3;
          const a3 = a1 + (4 * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a1) * triR, Math.sin(a1) * triR);
          ctx.lineTo(Math.cos(a2) * triR, Math.sin(a2) * triR);
          ctx.lineTo(Math.cos(a3) * triR, Math.sin(a3) * triR);
          ctx.closePath();
          ctx.strokeStyle = color;
          ctx.lineWidth = symbolStroke;
          ctx.stroke();
          break;
        }
        case 'psSquare': {
          const color = '#A855F7'; // Violet/rose (□)
          // Anneau blanc externe
          ctx.beginPath();
          ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
          // Bouton coloré
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Symbole: carré centré avec padding
          const side = r * 0.9; // carré plus petit pour un padding net
          const half = side / 2;
          ctx.beginPath();
          ctx.rect(-half, -half, side, side);
          ctx.strokeStyle = color;
          ctx.lineWidth = symbolStroke;
          ctx.stroke();
          break;
        }
        case 'psCross': {
          const color = '#3B82F6'; // Bleu (×)
          // Anneau blanc externe
          ctx.beginPath();
          ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
          // Bouton coloré
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.18)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Symbole: croix (deux segments diagonaux) centrée
          const len = symbolRadius * 1.3; // segments plus courts -> plus de padding
          const h = len / 2;
          ctx.strokeStyle = color;
          ctx.lineWidth = symbolStroke;
          ctx.beginPath();
          ctx.moveTo(-h, -h);
          ctx.lineTo(h, h);
          ctx.moveTo(-h, h);
          ctx.lineTo(h, -h);
          ctx.stroke();
          break;
        }
        case 'buttonA': {
          const color = '#22C55E'; // Vert (A)
          // Anneau blanc externe
          ctx.beginPath();
          ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
          // Bouton coloré
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Lettre centrée
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${r * 1.1}px Arial`;
          ctx.fillText('A', 0, 0);
          break;
        }
        case 'buttonB': {
          const color = '#D83C3C'; // Rouge (B)
          // Anneau blanc externe
          ctx.beginPath();
          ctx.arc(0, 0, r + 1.5, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = 1.25;
          ctx.stroke();
          // Bouton coloré
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(216, 60, 60, 0.18)';
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3;
          ctx.stroke();
          // Lettre centrée
          ctx.fillStyle = color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `700 ${r * 1.1}px Arial`;
          ctx.fillText('B', 0, 0);
          break;
        }
      }
      
      ctx.restore();
    };
    
    // Animation loop
    let animationFrameId: number;
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      shapes.forEach((shape) => {
        // Update position
        shape.y += shape.speed;
        shape.rotation += shape.rotationSpeed;
        
        // Reset position if out of view
        if (shape.y > canvas.height + shape.size) {
          shape.y = -shape.size;
          shape.x = Math.random() * canvas.width;
        }
        
        drawShape(shape);
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 1 }}
    />
  );
}

export function LoginHero() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = theme || resolvedTheme || 'light';
  const t = useTranslations('auth');
  
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
    <>
      {/* Effet d'arrière-plan pour mobile - visible partout */}
      <div className="md:hidden fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Effet brouillard avec dégradé pour mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-white/2 to-transparent backdrop-blur-[2px]" />
        
        {/* Formes géométriques animées pour mobile */}
        <MatrixShapes />
        {/* Overlay thématique en haut (semi-transparente) */}
        <div className={`${styles.overlay} opacity-60`} />
      </div>
      
      {/* Section hero pour desktop */}
      <div className={`hidden md:flex md:w-1/2 ${styles.container}`}>
        {/* Effet brouillard avec dégradé */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/2 to-transparent backdrop-blur-[2px] pointer-events-none" />
        
        {/* Formes géométriques animées */}
        <MatrixShapes />
        
        <div className={styles.overlay}>
          <div className="flex flex-col justify-center items-center h-full p-8 relative z-10">
            <h1 className={`${styles.title} elegant-title`}>
              <span className="elegant-text">MemCard</span>
              <div className="elegant-particles">
                <div className="particle particle-1"></div>
                <div className="particle particle-2"></div>
                <div className="particle particle-3"></div>
              </div>
            </h1>
            <p className={styles.description}>
              {t('heroDescription')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
