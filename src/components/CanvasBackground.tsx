import React, { useEffect } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'motion/react';

export const CanvasBackground: React.FC = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX / window.innerWidth) - 0.5);
      mouseY.set((e.clientY / window.innerHeight) - 0.5);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const smoothX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const smoothY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  const moveX = useTransform(smoothX, [-0.5, 0.5], [-50, 50]);
  const moveY = useTransform(smoothY, [-0.5, 0.5], [-50, 50]);

  const moveXReverse = useTransform(moveX, (v: number) => v * -1.5);
  const moveYReverse = useTransform(moveY, (v: number) => v * -1.5);

  return (
    <div id="canvas-container" className="fixed inset-0 pointer-events-none overflow-hidden z-[-1]">
      <motion.div 
        style={{ x: moveX, y: moveY }}
        className="bg-glow top-[-10%] left-[-10%]" 
      />
      <motion.div 
        style={{ 
          x: moveXReverse, 
          y: moveYReverse 
        }}
        className="bg-glow bottom-[-10%] right-[-10%] bg-blue-600/30" 
      />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
    </div>
  );
};
