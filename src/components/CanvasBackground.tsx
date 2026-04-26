import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

export const CanvasBackground: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const smoothX = useSpring(mousePosition.x, { damping: 20, stiffness: 100 });
  const smoothY = useSpring(mousePosition.y, { damping: 20, stiffness: 100 });

  const moveX = useTransform(smoothX, [-0.5, 0.5], [-50, 50]);
  const moveY = useTransform(smoothY, [-0.5, 0.5], [-50, 50]);

  return (
    <div id="canvas-container" className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      <motion.div 
        style={{ x: moveX, y: moveY }}
        className="bg-glow top-[-10%] left-[-10%]" 
      />
      <motion.div 
        style={{ 
          x: useTransform(moveX, (v) => v * -1.5), 
          y: useTransform(moveY, (v) => v * -1.5) 
        }}
        className="bg-glow bottom-[-10%] right-[-10%] bg-blue-600/30" 
      />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};
