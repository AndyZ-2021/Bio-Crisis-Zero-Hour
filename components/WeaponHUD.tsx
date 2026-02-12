import React from 'react';

interface WeaponHUDProps {
  ammo: number;
  isFiring: boolean;
  reloading: boolean;
}

const WeaponHUD: React.FC<WeaponHUDProps> = ({ ammo, isFiring, reloading }) => {
  return (
    <div className="absolute bottom-0 right-0 w-64 h-48 pointer-events-none z-40 flex flex-col items-end pr-8 pb-4">
      
      {/* Ammo Counter */}
      <div className="flex flex-col items-end mb-4">
        <div className="text-4xl font-black text-bio-green font-mono tracking-tighter drop-shadow-[0_0_5px_rgba(0,255,0,0.8)]">
           {reloading ? 'RELOAD' : ammo}
        </div>
        <div className="text-xs text-bio-green/70 font-mono tracking-widest">
           9MM PARABELLUM
        </div>
      </div>

      {/* Gun Graphic */}
      <div className={`relative transition-transform duration-75 ${isFiring ? 'translate-y-2 translate-x-1' : ''}`}>
        {/* Muzzle Flash */}
        {isFiring && !reloading && ammo > 0 && (
           <div className="absolute -top-16 -left-10 w-32 h-32 bg-yellow-100 rounded-full opacity-50 blur-xl animate-flash mix-blend-screen" />
        )}
        
        {/* Simple Gun Shape */}
        <svg width="200" height="150" viewBox="0 0 200 150">
           <path 
             d="M40,150 L60,100 L180,100 L180,70 L60,70 L50,150 Z" 
             fill="#111" 
             stroke="#333" 
             strokeWidth="2"
           />
           <rect x="60" y="65" width="120" height="35" fill="#222" stroke="#444" />
           <rect x="160" y="60" width="5" height="10" fill="#555" /> {/* Sight */}
        </svg>
      </div>
    </div>
  );
};

export default WeaponHUD;