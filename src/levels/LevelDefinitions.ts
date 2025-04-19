import { Level } from "./Level";
import { Orb } from "./Orb";
import { Teleporter } from "./Teleporter";


// Create a level with one orb in each window
export const leftLevel1 = new Level([
    new Orb(200, 300),
    new Teleporter(100, 200)
]);

export const rightLevel1 = new Level([
    new Orb(300, 400),
    new Teleporter(100, 300)
]);

// You can export more levels here as needed
export const leftLevels = [leftLevel1];
export const rightLevels = [rightLevel1];
