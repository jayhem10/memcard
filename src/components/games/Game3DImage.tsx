'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Game3DImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function Game3DImage({ src, alt, className = '' }: Game3DImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Valeurs de mouvement pour l'effet 3D
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Ajouter un ressort pour un mouvement plus fluide
  const springConfig = { damping: 20, stiffness: 100 }; // Ressort moins rigide pour éviter la déformation
  const rotateX = useSpring(useTransform(y, [-100, 100], [5, -5]), springConfig); // Réduire l'angle de rotation
  const rotateY = useSpring(useTransform(x, [-100, 100], [-5, 5]), springConfig); // Réduire l'angle de rotation
  
  // Effets de brillance améliorés - beaucoup plus visibles et réactifs aux mouvements
  const glowOpacity = useSpring(useMotionValue(0.9), { damping: 15, stiffness: 80 }); // Opacité très élevée pour une visibilité maximale
  
  // Créer un effet de brillance qui suit le mouvement de la souris
  const lightPositionX = useSpring(useTransform(x, [-100, 100], [30, 70]), { damping: 15, stiffness: 80 });
  const lightPositionY = useSpring(useTransform(y, [-100, 100], [30, 70]), { damping: 15, stiffness: 80 });
  
  // Gérer le mouvement de la souris sur la carte
  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculer la position relative de la souris par rapport au centre
    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;
    
    // Mettre à jour les valeurs de mouvement
    x.set(mouseX);
    y.set(mouseY);
  }
  
  // Réinitialiser les valeurs lorsque la souris quitte la carte
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }
  
  // Gérer les événements tactiles pour les appareils mobiles
  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (!cardRef.current || event.touches.length === 0) return;
    
    const touch = event.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculer la position relative du toucher par rapport au centre
    const touchX = touch.clientX - centerX;
    const touchY = touch.clientY - centerY;
    
    // Mettre à jour les valeurs de mouvement
    x.set(touchX);
    y.set(touchY);
    setIsHovered(true); // Activer l'effet de survol sur mobile
  }
  
  function handleTouchEnd() {
    // Réinitialiser progressivement les valeurs
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={() => setIsHovered(true)}
      onTouchEnd={handleTouchEnd}
      style={{
        perspective: 1000,
        transformStyle: 'preserve-3d',
        borderRadius: '0.5rem', // Assurer que la bordure reste arrondie
      }}
      whileHover={{ scale: 1.02 }}
    >
      <motion.div
        className="w-full h-full relative rounded-lg overflow-hidden"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          borderRadius: 'inherit',
        }}
      >
        {/* Image principale */}
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          priority
          className="object-cover"
        />
        
        {/* Effet de brillance qui suit le mouvement de la souris/doigt */}
        <motion.div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${lightPositionX}% ${lightPositionY}%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 35%, rgba(255,255,255,0) 70%)`,
            opacity: glowOpacity,
            transformStyle: 'preserve-3d',
            zIndex: 2,
            mixBlendMode: 'screen', // Mode de fusion plus intense pour une meilleure visibilité
            borderRadius: 'inherit',
            pointerEvents: 'none', // Permet de cliquer à travers l'effet de lumière
          }}
        />
        
        {/* Effet de brillance statique pour s'assurer qu'il y a toujours un peu de lumière */}
        <motion.div
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.6) 100%)',
            opacity: 0.8,
            transformStyle: 'preserve-3d',
            zIndex: 1,
            mixBlendMode: 'overlay',
            borderRadius: 'inherit',
            pointerEvents: 'none', // Permet de cliquer à travers l'effet de lumière
          }}
        />
        
        {/* Ombre portée */}
        <motion.div
          className="absolute -inset-2 bg-black rounded-lg"
          style={{
            opacity: useTransform(y, [-100, 0, 100], [0.3, 0.2, 0.3]),
            zIndex: -1,
            transform: 'translateZ(-10px)',
            filter: 'blur(20px)',
            borderRadius: '0.75rem',
          }}
        />
      </motion.div>
    </motion.div>
  );
}
