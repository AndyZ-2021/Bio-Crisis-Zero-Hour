import React, { useState, useEffect, useRef } from 'react';
import { GameState, HealthStatus, GamePhase, Enemy } from './types';
import { generateGameTurn, generateSceneImage } from './services/geminiService';
import ECGMonitor from './components/ECGMonitor';
import CombatLayer from './components/CombatLayer';
import WeaponHUD from './components/WeaponHUD';
import { Target, Search, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';

const INITIAL_STATE: GameState = {
  phase: 'EXPLORE',
  health: 100,
  healthStatus: HealthStatus.FINE,
  ammo: 15,
  location: "Main Hall",
  inventory: [],
  visualDescription: "A grand gothic hall. Double staircase. Moonlight.",
  lastLog: "CRISIS-OS v1.0. Zero Hour Protocol Initiated...",
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [backgroundImg, setBackgroundImg] = useState<string | null>(null);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [isFiring, setIsFiring] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [flash, setFlash] = useState(false);
  
  // Initial Load
  useEffect(() => {
    loadLevel(INITIAL_STATE.visualDescription);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLevel = async (description: string) => {
    // Optimistic UI for loading
    setGameState(prev => ({ ...prev, phase: 'LOADING' }));
    const img = await generateSceneImage(description);
    if (img) setBackgroundImg(img);
    setGameState(prev => ({ ...prev, phase: 'EXPLORE' }));
  };

  const processTurn = async (action: string) => {
    if (gameState.phase === 'COMBAT') return;
    
    setGameState(prev => ({ ...prev, phase: 'LOADING' }));

    const response = await generateGameTurn(action, gameState);
    
    // Check for encounter
    if (response.encounter?.hasEnemies) {
      startCombat(response.encounter.enemyCount, response.encounter.enemyType);
    }

    // Load new image if location changed or visualPrompt is distinctly new
    if (response.visualPrompt) {
       // We load image in background but don't block state update if we want faster text
       generateSceneImage(response.visualPrompt).then(img => {
         if (img) setBackgroundImg(img);
       });
    }

    setGameState(prev => ({
      ...prev,
      phase: response.encounter?.hasEnemies ? 'COMBAT' : 'EXPLORE',
      ammo: prev.ammo + (response.stateUpdate.ammoChange || 0),
      health: Math.min(100, prev.health + (response.stateUpdate.healthChange || 0)),
      location: response.stateUpdate.location || prev.location,
      visualDescription: response.visualPrompt,
      lastLog: response.narrative
    }));
  };

  const startCombat = (count: number, type: 'zombie' | 'boss') => {
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < count; i++) {
      newEnemies.push({
        id: `enemy-${Date.now()}-${i}`,
        x: 20 + Math.random() * 60, // Keep somewhat central
        y: 40 + Math.random() * 20,
        scale: 0.1, // Start far away
        hp: type === 'boss' ? 15 : 3,
        maxHp: type === 'boss' ? 15 : 3,
        speed: 0.5 + Math.random() * 0.5,
        type: type,
        isDead: false
      });
    }
    setEnemies(newEnemies);
  };

  const handleShoot = (enemyId?: string) => {
    if (gameState.ammo <= 0) {
      playSound('dryfire');
      return;
    }

    // FX
    setIsFiring(true);
    setScreenShake(true);
    setFlash(true);
    setTimeout(() => {
       setIsFiring(false);
       setScreenShake(false);
       setFlash(false);
    }, 100);

    setGameState(prev => ({ ...prev, ammo: prev.ammo - 1 }));

    // If we hit nothing, just ammo loss
    if (!enemyId) return;
  };

  const handlePlayerDamage = (amount: number) => {
    setGameState(prev => {
      const newHealth = prev.health - amount;
      let status = HealthStatus.FINE;
      if (newHealth < 50) status = HealthStatus.CAUTION;
      if (newHealth < 20) status = HealthStatus.DANGER;
      if (newHealth <= 0) status = HealthStatus.DEAD;
      
      return {
        ...prev,
        health: newHealth,
        healthStatus: status,
        phase: newHealth <= 0 ? 'GAME_OVER' : prev.phase
      };
    });
    
    // Red flash effect could go here
    document.body.style.backgroundColor = 'red';
    setTimeout(() => document.body.style.backgroundColor = 'black', 100);
  };

  const handleCombatCleared = () => {
    setGameState(prev => ({ 
      ...prev, 
      phase: 'EXPLORE', 
      lastLog: "Threat eliminated. Area clear." 
    }));
    setEnemies([]);
  };

  const playSound = (type: string) => {
    // Placeholder for audio implementation
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden crosshair-cursor ${screenShake ? 'animate-shake' : ''}`}>
      
      {/* 1. VIEWPORT LAYER (Background Image) */}
      <div className="absolute inset-0 z-0">
        {backgroundImg ? (
          <img src={backgroundImg} className="w-full h-full object-cover brightness-50 contrast-125" alt="Scene" />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <span className="text-bio-green animate-pulse">ESTABLISHING VISUAL LINK...</span>
          </div>
        )}
        {/* Flash Effect */}
        {flash && <div className="absolute inset-0 bg-white/20 z-10" />}
      </div>

      {/* 2. COMBAT LAYER */}
      {gameState.phase === 'COMBAT' && (
        <CombatLayer 
          enemies={enemies}
          onShoot={(id) => handleShoot(id)}
          onMiss={() => handleShoot()}
          onDamagePlayer={handlePlayerDamage}
          onEnemiesCleared={handleCombatCleared}
        />
      )}

      {/* 3. VIGNETTE & CRT OVERLAY */}
      <div className="absolute inset-0 z-40 vignette pointer-events-none" />
      <div className="absolute inset-0 z-50 crt-overlay" />

      {/* 4. HUD LAYER */}
      <div className="absolute inset-0 z-50 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Top Bar: Location & Health */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
             <div className="text-bio-green text-sm font-mono border-l-4 border-bio-green pl-2 bg-black/60 pr-4 py-1">
               {gameState.location}
             </div>
             <div className="w-48">
               <ECGMonitor status={gameState.healthStatus} />
             </div>
          </div>
          
          {/* Messages Log */}
          <div className="max-w-md text-right font-mono text-xs text-bio-green bg-black/60 p-2 border-r-4 border-bio-green">
             {gameState.phase === 'LOADING' ? (
               <span className="animate-pulse">ANALYZING ENVIRONMENT...</span>
             ) : (
               gameState.lastLog
             )}
          </div>
        </div>

        {/* Center: Interaction (Only in Explore) */}
        {gameState.phase === 'EXPLORE' && (
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 pointer-events-auto">
              {/* Move Forward */}
              <button 
                onClick={() => processTurn("Move forward")}
                className="p-4 bg-black/40 border border-white/20 hover:border-bio-green hover:bg-black/80 hover:text-bio-green text-white rounded-full transition-all group"
              >
                <ArrowUp size={32} className="group-hover:-translate-y-1 transition-transform" />
              </button>
              
              <div className="flex gap-12">
                <button 
                  onClick={() => processTurn("Turn left")}
                  className="p-4 bg-black/40 border border-white/20 hover:border-bio-green hover:bg-black/80 hover:text-bio-green text-white rounded-full transition-all group"
                >
                  <ArrowLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
                </button>

                <div className="w-16" /> {/* Spacer for center */}
                
                <button 
                  onClick={() => processTurn("Turn right")}
                  className="p-4 bg-black/40 border border-white/20 hover:border-bio-green hover:bg-black/80 hover:text-bio-green text-white rounded-full transition-all group"
                >
                  <ArrowRight size={32} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-4">
                 <button 
                   onClick={() => processTurn("Search the area thoroughly")}
                   className="flex items-center gap-2 px-6 py-2 bg-bio-panel border border-gray-600 text-white hover:border-bio-green hover:text-bio-green uppercase font-mono text-sm tracking-widest transition-colors"
                 >
                   <Search size={16} /> Search Area
                 </button>
              </div>
           </div>
        )}

        {/* Game Over Screen */}
        {gameState.phase === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center pointer-events-auto flex-col">
             <h1 className="text-8xl font-black text-black mb-4 tracking-tighter uppercase">You Died</h1>
             <button 
               onClick={() => window.location.reload()}
               className="px-8 py-3 bg-black text-white font-mono hover:bg-red-600 transition-colors"
             >
               RESTART SIMULATION
             </button>
          </div>
        )}

        {/* Bottom Right: Weapon */}
        <WeaponHUD 
          ammo={gameState.ammo} 
          isFiring={isFiring} 
          reloading={gameState.ammo === 0}
        />
        
      </div>
    </div>
  );
};

export default App;