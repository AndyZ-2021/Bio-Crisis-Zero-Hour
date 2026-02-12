export enum HealthStatus {
  FINE = 'FINE',
  CAUTION = 'CAUTION',
  DANGER = 'DANGER',
  DEAD = 'DEAD'
}

export type GamePhase = 'EXPLORE' | 'COMBAT' | 'GAME_OVER' | 'LOADING';

export interface Enemy {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  scale: number; // 0.1 (far) to 1.5 (attacking)
  hp: number;
  maxHp: number;
  speed: number;
  type: 'zombie' | 'boss';
  isDead: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  type: 'weapon' | 'healing' | 'key' | 'misc';
}

export interface GameState {
  phase: GamePhase;
  health: number;
  healthStatus: HealthStatus;
  ammo: number;
  location: string;
  inventory: InventoryItem[];
  visualDescription: string;
  lastLog: string;
}

// AI Response
export interface GameTurnResponse {
  narrative: string;
  visualPrompt: string;
  encounter?: {
    hasEnemies: boolean;
    enemyCount: number;
    enemyType: 'zombie' | 'boss';
  };
  stateUpdate: {
    healthChange?: number;
    ammoChange?: number;
    location?: string;
    itemFound?: InventoryItem;
  };
}