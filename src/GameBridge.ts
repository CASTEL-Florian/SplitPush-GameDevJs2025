// GameBridge.ts
type Listener = (data?: any) => void;

class GameBridge {
    public listeners: Map<string, Listener[]> = new Map();

    // Subscribe to an event
    on(eventName: string, callback: Listener): void {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        this.listeners.get(eventName)?.push(callback);
        console.log(`[Bridge] Listener added for: ${eventName}`); // Added for debugging
    }

    // Unsubscribe from an event
    off(eventName: string, callback: Listener): void {
        const eventListeners = this.listeners.get(eventName);
        if (eventListeners) {
            const initialLength = eventListeners.length;
            this.listeners.set(
                eventName,
                eventListeners.filter(listener => listener !== callback)
            );
             if (this.listeners.get(eventName)?.length !== initialLength) {
                 console.log(`[Bridge] Listener removed for: ${eventName}`); // Added for debugging
             }
        }
    }

    // Emit an event to all listeners
    emit(eventName: string, data?: any): void {
        const eventListeners = this.listeners.get(eventName);
         console.log(`[Bridge] Emitting event: ${eventName}`, data); // Added for debugging
        if (eventListeners) {
             console.log(`[Bridge] Found ${eventListeners.length} listeners for ${eventName}`); // Added for debugging
            // Iterate over a copy in case listeners modify the array during iteration
            [...eventListeners].forEach(listener => {
                try {
                     listener(data);
                } catch (error) {
                    console.error(`Error in listener for event "${eventName}":`, error);
                }
            });
        } else {
             console.log(`[Bridge] No listeners found for ${eventName}`); // Added for debugging
        }
    }
}

// Create a single instance to be shared
export const gameBridge = new GameBridge();

// --- Define Event Names ---
export const Events = {
    // Game state events
    GAME_OVER: 'game-over',
    RESTART_GAME: 'restart-game',

    // Player events
    PLAYER_POSITION_UPDATE: 'player-position-update', // <-- Add this event
};

// --- Define Shared Types ---
export type WindowID = 'left' | 'right' | 'undefined';

// Type for player position data shared via the bridge
export type PlayerPositionData = {
    x: number;
    y: number;
    windowId: WindowID;
};