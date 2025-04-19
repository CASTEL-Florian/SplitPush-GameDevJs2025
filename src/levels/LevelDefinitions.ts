import { Level } from "./Level";
import { Orb } from "./Orb";

// Example: Define the size/positions of your windows here
// For demonstration, let's assume two windows, left and right halves of an 800x600 screen
const windowPositions = [
    { x: 200, y: 300 }, // Center of left window
    { x: 300, y: 400 }, // Center of right window
];

// Create a level with one orb in each window
export const leftLevel1 = new Level([
    new Orb(windowPositions[0].x, windowPositions[0].y),
]);

export const rightLevel1 = new Level([
    new Orb(windowPositions[1].x, windowPositions[1].y),
]);

// You can export more levels here as needed
export const leftLevels = [leftLevel1];
export const rightLevels = [rightLevel1];
