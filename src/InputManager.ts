// src/InputManager.ts
// Centralized input management for keyboard (and extensible for mouse/gamepad)

export type KeyState = {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
};

class InputManager {
  private static _instance: InputManager;
  private keyStates: Map<string, KeyState> = new Map();
  private prevKeyStates: Map<string, boolean> = new Map();

  private constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public static get instance(): InputManager {
    if (!InputManager._instance) {
      InputManager._instance = new InputManager();
    }
    return InputManager._instance;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const state = this.keyStates.get(e.code) || { pressed: false, justPressed: false, justReleased: false };
    if (!state.pressed) {
      state.justPressed = true;
    }
    state.pressed = true;
    state.justReleased = false;
    this.keyStates.set(e.code, state);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const state = this.keyStates.get(e.code) || { pressed: false, justPressed: false, justReleased: false };
    state.justReleased = true;
    state.pressed = false;
    state.justPressed = false;
    this.keyStates.set(e.code, state);
  };

  /**
   * Call once per game frame to update key states (should be called in your game loop)
   */
  public update() {
    for (const [code, state] of this.keyStates.entries()) {
      state.justPressed = !(this.prevKeyStates.get(code) ?? false) && state.pressed;
state.justReleased = (this.prevKeyStates.get(code) ?? false) && !state.pressed;
      this.prevKeyStates.set(code, state.pressed);
    }
  }

  public isPressed(code: string): boolean {
    return !!this.keyStates.get(code)?.pressed;
  }

  public isJustPressed(code: string): boolean {
    return !!this.keyStates.get(code)?.justPressed;
  }

  public isJustReleased(code: string): boolean {
    return !!this.keyStates.get(code)?.justReleased;
  }

  // Optionally, add mouse/gamepad support here
}

export default InputManager;
