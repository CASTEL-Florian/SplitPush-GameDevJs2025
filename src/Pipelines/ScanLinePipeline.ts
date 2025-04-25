import Phaser from 'phaser';

export class ScanlinePipeline extends Phaser.Renderer.WebGL.Pipelines.MultiPipeline {
    public intensity: number = 0.2;

    public lineFrequency: number = 180.0;

    public scrollSpeed: number = -0.0006;

    /**
     * Controls the frequency of the vertical sine wave modulating the scanline intensity.
     * Math.PI (default) creates one peak intensity band in the middle of the screen.
     * 2.0 * Math.PI would create two full sine waves vertically.
     * @default Math.PI
     */
    public verticalWaveFrequency: number = Math.PI; // One sine hump vertically

    constructor(game: Phaser.Game) {
        super({
            name: 'ScanlinePipeline',
            game: game,
            renderTarget: true, // Important for post-processing effects
            fragShader: `
                precision mediump float;

                // Input texture (the sprite/scene being rendered)
                uniform sampler2D uMainSampler;
                // Current game time in milliseconds
                uniform float uTime;
                // Overall intensity multiplier for the effect
                uniform float uIntensity;
                // How many scanlines vertically (controls thickness)
                uniform float uLineFrequency;
                // How fast the lines scroll down
                uniform float uScrollSpeed;
                // Frequency of the vertical sine wave intensity modulation
                uniform float uVerticalWaveFrequency;

                // Texture coordinates (UVs) from vertex shader (0,0 to 1,1)
                varying vec2 outTexCoord;

                void main(void) {
                    // 1. Sample the original texture color
                    vec4 originalColor = texture2D(uMainSampler, outTexCoord);

                    // 2. Calculate the vertical sine wave intensity factor
                    // This makes the scanline effect stronger/weaker in waves down the screen.
                    // (sin(...) + 1.0) * 0.5 maps the sine range (-1 to 1) to (0 to 1).
                    float verticalWave = (sin(outTexCoord.y * uVerticalWaveFrequency) + 1.0) * 0.5; // 0.0 to 1.0

                    // 3. Calculate the basic scanline pattern
                    // We use the y-coordinate and time to create moving horizontal lines.
                    // 'coord' effectively represents the vertical position within the repeating scanline pattern.
                    float timeOffsetY = uTime * uScrollSpeed;
                    float coord = outTexCoord.y * uLineFrequency + timeOffsetY;
                    // Use the fractional part to get a repeating 0-1 value.
                    // A sine/cosine wave creates smoother transitions between bright/dark lines.
                    // (cos(...) + 1.0) * 0.5 maps the cosine range (-1 to 1) to (0 to 1).
                    // We multiply by PI because cos(0)=1, cos(PI)=-1, cos(2*PI)=1, creating one cycle per unit.
                    float scanlineFactor = (cos(coord * 3.14159) + 1.0) * 0.5; // 0.0 to 1.0 (brighter/darker bands)

                    // 4. Combine factors and apply intensity
                    // - We want darkness, so invert scanlineFactor (1.0 - factor).
                    // - Modulate this darkness by the vertical sine wave.
                    // - Multiply by the global intensity uniform.
                    float effectStrength = (1.0 - scanlineFactor) * verticalWave * uIntensity; // 0.0 (no effect) to uIntensity (max effect)

                    // 5. Modify the original color
                    // Reduce the brightness of the original color based on the effect strength.
                    // (1.0 - effectStrength) ensures that where effectStrength is high, brightness is low.
                    vec3 finalColor = originalColor.rgb * (1.0 - effectStrength);

                    // 6. Set the output alpha based *only* on the effect strength
                    // As requested, the alpha channel represents the calculated intensity of the scanline effect at this pixel.
                    // The original texture's alpha (originalColor.a) is ignored.
                    float finalAlpha = effectStrength;

                    // Output the final color and the calculated alpha
                    gl_FragColor = vec4(finalColor, finalAlpha);
                }
            `
        });
    }

    // Called automatically before the pipeline renders.
    // Passes JavaScript properties to the shader uniforms.
    onPreRender() {
        this.set1f('uIntensity', this.intensity);
        this.set1f('uLineFrequency', this.lineFrequency);
        this.set1f('uScrollSpeed', this.scrollSpeed);
        this.set1f('uVerticalWaveFrequency', this.verticalWaveFrequency);
        // Pass the current game time (in milliseconds) to the shader
        this.set1f('uTime', this.game.loop.time);
    }

    // Optional helper methods to set properties easily
    setIntensity(value: number) {
        this.intensity = value;
    }

    setLineFrequency(value: number) {
        this.lineFrequency = value;
    }

    setScrollSpeed(value: number) {
        this.scrollSpeed = value;
    }

     setVerticalWaveFrequency(value: number) {
        this.verticalWaveFrequency = value;
    }
}