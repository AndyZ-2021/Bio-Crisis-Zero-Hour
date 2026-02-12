import React from 'react';
import { HealthStatus } from '../types';

interface ECGMonitorProps {
  status: HealthStatus;
}

const ECGMonitor: React.FC<ECGMonitorProps> = ({ status }) => {
  const getColor = () => {
    switch (status) {
      case HealthStatus.FINE: return 'stroke-bio-green shadow-[0_0_10px_#00ff00]';
      case HealthStatus.CAUTION: return 'stroke-yellow-500 shadow-[0_0_10px_#eab308]';
      case HealthStatus.DANGER: return 'stroke-bio-red shadow-[0_0_10px_#ff0000]';
      case HealthStatus.DEAD: return 'stroke-gray-500';
      default: return 'stroke-bio-green';
    }
  };

  const getAnimationDuration = () => {
    switch (status) {
      case HealthStatus.FINE: return '2s';
      case HealthStatus.CAUTION: return '1s'; // Faster heart rate
      case HealthStatus.DANGER: return '0.6s'; // Very fast/erratic
      case HealthStatus.DEAD: return '0s';
      default: return '2s';
    }
  };

  // SVG Path for a heartbeat
  const pathData = "M0,50 L20,50 L30,20 L40,80 L50,10 L60,50 L100,50";

  return (
    <div className="relative w-full h-16 bg-black border border-gray-800 rounded overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
             backgroundSize: '10px 10px'
           }}>
      </div>

      <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        {status !== HealthStatus.DEAD ? (
           <path 
             d={pathData} 
             fill="none" 
             strokeWidth="3" 
             className={`${getColor()} transition-all duration-500`}
             style={{
                strokeDasharray: 200,
                strokeDashoffset: 200,
                animation: `dash ${getAnimationDuration()} linear infinite`
             }}
           />
        ) : (
          <line x1="0" y1="50" x2="100" y2="50" stroke="gray" strokeWidth="2" />
        )}
      </svg>
      
      <style>{`
        @keyframes dash {
          0% { stroke-dashoffset: 200; }
          50% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
      `}</style>

      <div className="absolute bottom-1 right-2 text-xs font-mono font-bold tracking-widest text-white/70">
        {status}
      </div>
    </div>
  );
};

export default ECGMonitor;