import Phaser from 'phaser';

export class GridTransitionPipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
    /**
     * The progress of the transition effect (0.0 to 1.0).
     * 0.0 = Fully transparent
     * 1.0 = Fully opaque (showing the target texture)
     */
    public progress: number = 0.0;

    /**
     * The number of grid cells horizontally and vertically.
     */
    public gridSize: Phaser.Math.Vector2 = new Phaser.Math.Vector2(7, 9); // Default 10x10 grid

    constructor(game: Phaser.Game) {
        super({
            name: 'GridTransitionPipeline',
            game: game,
            renderTarget: true, // Crucial for transitions/post-processing
            fragShader: `
                precision mediump float;

                // The texture containing the scene/image to transition TO
                uniform sampler2D uMainSampler;
                // The progress of the transition (0.0 to 1.0)
                uniform float uProgress;
                // The dimensions of the grid (e.g., vec2(10.0, 10.0))
                uniform vec2 uGridSize;

                // Texture coordinates (UVs) varying from (0,0) bottom-left to (1,1) top-right
                varying vec2 outTexCoord;

                void main(void) {
                    // --- Grid Calculation ---
                    // Calculate the size of one grid cell in UV space
                    vec2 cellSize = 1.0 / uGridSize;
                    // Calculate the integer coordinates of the cell this pixel belongs to
                    vec2 cellCoord = floor(outTexCoord * uGridSize); // or floor(outTexCoord / cellSize);
                    // Calculate the center of this cell in UV space
                    vec2 cellCenter = (cellCoord + 0.5) * cellSize; // or (cellCoord + 0.5) / uGridSize;
                    // Calculate the pixel's position relative to the center of its cell
                    vec2 posInCell = outTexCoord - cellCenter;

                    // --- Transition Timing ---
                    // Calculate how far the transition has progressed *for this specific row*.
                    // Lower rows (smaller cellCoord.y) should start earlier.
                    // We scale uProgress by the number of rows and subtract the current row index.
                    // This means row 0 starts progressing when uProgress > 0.
                    // Row 1 starts progressing when uProgress > 1/uGridSize.y, etc.
                    // The top row (uGridSize.y - 1) starts when uProgress > (uGridSize.y - 1) / uGridSize.y.
                    float rowProgress = uProgress * uGridSize.y - cellCoord.y;

                    // Clamp the row's progress between 0.0 (not started) and 1.0 (fully grown)
                    float clampedRowProgress = clamp(rowProgress, 0.0, 1.0);

                    // --- Square Growth ---
                    // Calculate the current half-size of the square based on the row's progress.
                    // When clampedRowProgress is 0, size is 0.
                    // When clampedRowProgress is 1, size is half the cell size.
                    vec2 currentSquareHalfSize = (cellSize * 0.5) * clampedRowProgress;

                    // --- Visibility Check ---
                    // Check if the pixel's position within the cell is inside the current square bounds.
                    // We use absolute position because posInCell can be negative.
                    bool inside = abs(posInCell.x) <= currentSquareHalfSize.x && abs(posInCell.y) <= currentSquareHalfSize.y;

                    // --- Final Color ---
                    // Sample the target texture color
                    vec4 textureColor = texture2D(uMainSampler, outTexCoord);

                    // If inside the growing square, use the texture color.
                    // Otherwise, use fully transparent black.
                    // Multiplying by float(inside) achieves this (0.0 for false, 1.0 for true).
                    gl_FragColor = textureColor * float(inside);

                    // Alternative for clarity:
                    // if (inside) {
                    //     gl_FragColor = textureColor;
                    // } else {
                    //     gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0); // Transparent
                    // }
                }
            `
        });

        // Initialize Vector2 for grid size if not already done by the caller
        if (!this.gridSize) {
            this.gridSize = new Phaser.Math.Vector2(10, 10);
        }
    }

    // Called automatically before the pipeline renders.
    onPreRender() {
        // Set the 'uProgress' uniform in the fragment shader
        this.set1f('uProgress', this.progress);
        // Set the 'uGridSize' uniform in the fragment shader
        this.set2f('uGridSize', this.gridSize.x, this.gridSize.y);
    }

    setProgress(value: number) {
        this.progress = Phaser.Math.Clamp(value, 0, 2);
    }

    setGridSize(width: number, height: number) {
        this.gridSize.set(width, height);
    }
}