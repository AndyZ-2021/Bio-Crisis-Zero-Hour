import React, { useEffect, useRef, useState } from 'react';
import { Enemy } from '../types';

interface CombatLayerProps {
  enemies: Enemy[];
  onShoot: (enemyId: string) => void;
  onMiss: () => void;
  onDamagePlayer: (amount: number) => void;
  onEnemiesCleared: () => void;
}

const CombatLayer: React.FC<CombatLayerProps> = ({ 
  enemies: initialEnemies, 
  onShoot, 
  onMiss, 
  onDamagePlayer,
  onEnemiesCleared
}) => {
  const [activeEnemies, setActiveEnemies] = useState<Enemy[]>(initialEnemies);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Game Loop
  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = time - lastTimeRef.current;
      
      setActiveEnemies(prev => {
        const nextEnemies = prev.map(e => {
          // Move enemy closer (increase scale)
          // Speed increases as they get closer
          const speedFactor = 0.00005 * e.speed * deltaTime; 
          const newScale = e.scale + speedFactor;

          // Attack Logic
          if (newScale >= 1.5) {
            // Enemy reached player
            onDamagePlayer(15);
            return { ...e, scale: 0.5 }; // Reset distance (push back) or keep attacking?
            // Let's "push back" after attack for gameplay balance
          }
          return { ...e, scale: newScale };
        });
        
        return nextEnemies;
      });
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check victory condition
  useEffect(() => {
    if (activeEnemies.length === 0) {
      setTimeout(onEnemiesCleared, 1000); // Short delay before ending combat
    }
  }, [activeEnemies, onEnemiesCleared]);

  const handleShoot = (e: React.MouseEvent, enemyId: string) => {
    e.stopPropagation(); // Prevent hitting the background
    
    setActiveEnemies(prev => prev.map(en => {
      if (en.id === enemyId) {
        const newHp = en.hp - 1;
        if (newHp <= 0) return null; // Mark for removal
        return { ...en, hp: newHp, scale: en.scale - 0.1 }; // Slight knockback
      }
      return en;
    }).filter(Boolean) as Enemy[]);
    
    onShoot(enemyId);
  };

  const handleBackgroundClick = () => {
    onMiss();
  };

  return (
    <div 
      className="absolute inset-0 z-30 overflow-hidden" 
      onClick={handleBackgroundClick}
    >
      {activeEnemies.map(enemy => (
        <div
          key={enemy.id}
          onClick={(e) => handleShoot(e, enemy.id)}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-crosshair select-none flex flex-col items-center justify-center"
          style={{
            left: `${enemy.x}%`,
            top: `${enemy.y}%`,
            scale: `${enemy.scale}`,
            zIndex: Math.floor(enemy.scale * 100), // Closer enemies on top
            transition: 'opacity 0.2s'
          }}
        >
          {/* Health Bar */}
          <div className="w-20 h-2 bg-red-900 mb-2 border border-black overflow-hidden">
             <div 
               className="h-full bg-green-500" 
               style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
             />
          </div>

          {/* ZOMBIE VISUAL */}
          <div className="relative group">
            {/* Simple Scary CSS Zombie */}
            <svg width="100" height="150" viewBox="0 0 100 150" className="drop-shadow-2xl">
              <g className="animate-[pulse-fast_2s_infinite]">
                 {/* Body */}
                 <path d="M20,150 L25,80 L75,80 L80,150 Z" fill="#2a2a2a" />
                 <rect x="25" y="50" width="50" height="60" fill="#3a4a3a" rx="5" />
                 {/* Arms */}
                 <path d="M25,60 L-10,40 L0,90" stroke="#5a6a5a" strokeWidth="12" fill="none" />
                 <path d="M75,60 L110,40 L100,90" stroke="#5a6a5a" strokeWidth="12" fill="none" />
                 {/* Head */}
                 <circle cx="50" cy="35" r="25" fill="#6b7b6b" />
                 {/* Eyes */}
                 <circle cx="40" cy="30" r="4" fill="#ff0000" className="animate-[flicker_0.1s_infinite]" />
                 <circle cx="60" cy="30" r="2" fill="#aaaaaa" />
                 {/* Mouth */}
                 <path d="M35,45 Q50,55 65,45" stroke="#220000" strokeWidth="3" fill="none" />
                 {/* Blood */}
                 <path d="M35,45 L35,55 M40,48 L40,60" stroke="#880000" strokeWidth="2" />
              </g>
            </svg>
            
            {/* Hitbox indicator on hover */}
            <div className="absolute inset-0 bg-red-500/0 hover:bg-red-500/10 rounded-full transition-colors" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CombatLayer;