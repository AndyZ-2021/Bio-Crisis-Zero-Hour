import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameState, GameTurnResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const gameTurnSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    narrative: {
      type: Type.STRING,
      description: "Brief, punchy status update (max 15 words). E.g. 'Entered the Main Hall. It's quiet.'",
    },
    visualPrompt: {
      type: Type.STRING,
      description: "First-person perspective visual description. Focus on depth and atmosphere.",
    },
    encounter: {
      type: Type.OBJECT,
      properties: {
        hasEnemies: { type: Type.BOOLEAN },
        enemyCount: { type: Type.INTEGER },
        enemyType: { type: Type.STRING, enum: ['zombie', 'boss'] }
      },
      nullable: true
    },
    stateUpdate: {
      type: Type.OBJECT,
      properties: {
        healthChange: { type: Type.INTEGER },
        ammoChange: { type: Type.INTEGER },
        location: { type: Type.STRING },
        itemFound: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            quantity: { type: Type.INTEGER },
            type: { type: Type.STRING }
          },
          nullable: true
        }
      }
    }
  },
  required: ["narrative", "visualPrompt", "stateUpdate"]
};

export const generateGameTurn = async (
  action: string,
  currentState: GameState
): Promise<GameTurnResponse> => {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are the Engine for a First-Person Shooter horror game.
    Your job is to generate the level state and decide if combat occurs.
    
    Current Location: ${currentState.location}
    Action: ${action}
    
    Rules:
    1. If the user moves to a new area, describe it visually.
    2. Randomly trigger combat encounters (20-40% chance) unless the user explicitly searched and found nothing previously.
    3. If combat triggers, set encounter.hasEnemies = true.
    4. Provide small amounts of ammo (2-5 rounds) occasionally if user searches.
    5. Keep narratives extremely short, like a HUD update.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: action,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: gameTurnSchema,
        temperature: 0.8,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(text) as GameTurnResponse;
  } catch (error) {
    console.error("AI Error:", error);
    return {
      narrative: "Signal lost...",
      visualPrompt: "Static noise",
      stateUpdate: {},
      encounter: { hasEnemies: false, enemyCount: 0, enemyType: 'zombie' }
    };
  }
};

export const generateSceneImage = async (prompt: string): Promise<string | null> => {
  const model = "gemini-2.5-flash-image"; 
  const enhancedPrompt = `
    First-person shooter viewpoint, HUD removed. 
    Survival horror atmosphere, Resident Evil style, dark, gritty, photorealistic, 4k.
    The camera is at eye level looking down a hallway or into a room.
    Scene: ${prompt}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: enhancedPrompt,
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};