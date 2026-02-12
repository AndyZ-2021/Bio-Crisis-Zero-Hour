import React from 'react';
import { InventoryItem } from '../types';
import { Briefcase, Heart, Key, Box } from 'lucide-react';

interface InventoryGridProps {
  items: InventoryItem[];
}

const InventoryGrid: React.FC<InventoryGridProps> = ({ items }) => {
  const slots = Array(8).fill(null); // Fixed 8 slots inventory

  return (
    <div className="border border-gray-600 bg-bio-panel p-2">
      <h3 className="text-gray-400 text-xs uppercase tracking-widest mb-2 border-b border-gray-700 pb-1">Inventory</h3>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((_, index) => {
          const item = items[index];
          return (
            <div 
              key={index} 
              className={`aspect-square border ${item ? 'border-gray-500 bg-gray-800' : 'border-gray-800 bg-black/50'} flex flex-col items-center justify-center relative group`}
            >
              {item && (
                <>
                  <div className="text-white">
                    {item.type === 'healing' && <Heart className="w-6 h-6 text-green-500" />}
                    {item.type === 'weapon' && <Box className="w-6 h-6 text-red-500" />}
                    {item.type === 'key' && <Key className="w-6 h-6 text-yellow-500" />}
                    {item.type === 'misc' && <Briefcase className="w-6 h-6 text-blue-500" />}
                  </div>
                  {item.quantity > 1 && (
                    <span className="absolute bottom-0 right-1 text-xs text-white font-mono">x{item.quantity}</span>
                  )}
                  {/* Tooltip */}
                  <div className="absolute hidden group-hover:block z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-bio-dark border border-gray-500 p-2 text-[10px] text-gray-200 shadow-lg">
                    <p className="font-bold text-bio-green">{item.name}</p>
                    <p>{item.description}</p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryGrid;