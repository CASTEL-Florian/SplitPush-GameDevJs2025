#ifdef GL_ES
precision mediump float;
#endif

// Uniforms provided by the JavaScript/WebGL host
uniform float u_time;       // Corresponds to iTime
uniform vec2 u_resolution; // Corresponds to iResolution.xy

// --- Helper Functions (Copied directly from Shadertoy) ---

// Simple pseudo-random hash
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Simple 2D value noise
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f); // Smoothstep interpolation

    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal Brownian Motion (FBM)
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 2.0;
    const int octaves = 6; // Number of noise layers

    for (int i = 0; i < octaves; i++) {
        value += amplitude * noise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// --- Main Shader Function ---

void main() {
    // Normalized pixel coordinates (from 0 to 1)
    // Use gl_FragCoord (built-in) and u_resolution (uniform)
    vec2 uv = gl_FragCoord.xy / u_resolution.xy;

    // Time for animation
    // Use u_time (uniform)
    float time = u_time * 0.2;

    // --- Parameters ---
    float noiseScale = 4.0;        // How zoomed in the noise is
    float noiseSpeed = 0.3;        // How fast the base noise pattern drifts
    float warpIntensity = 0.15;     // How much the noise pattern swirls/warps
    float transitionCenter = 0.5;  // Center point of the transition (0 = left, 1 = right)
    float transitionWidth = 0.05;   // How wide/smooth the transition is
    float edgeIntensity = 1.0;     // Extra brightness/intensity near the transition edge
    float edgeWarpScale = 5.0;    // Scale of the noise used to warp the edge
    float edgeWarpSpeed = 0.8;     // Speed of the edge warping
    float pushStrength = 0.3;      // How strongly the sides push against each other

    // --- Noise Base Coordinates ---
    vec2 base_uv = uv * noiseScale;

    // Add some warping/swirling to the noise coordinates based on time and another noise layer
    vec2 warp_uv_offset = vec2(time * noiseSpeed, time * noiseSpeed * 0.7); // Base drift
    float warpNoise = fbm((base_uv + warp_uv_offset) * 0.5 + time * 0.1); // Slower, larger scale warp noise
    vec2 swirlOffset = vec2(cos(warpNoise * 3.14159), sin(warpNoise * 3.14159)) * warpIntensity;
    vec2 warped_uv = base_uv + warp_uv_offset + swirlOffset; // Base coordinates after drift and swirl

    // --- Transition Calculation ---
    // Warp the horizontal position slightly for a more dynamic edge
    float edgeWarpNoise = noise(uv * edgeWarpScale + vec2(0.0, time * edgeWarpSpeed));
    float warpedX = uv.x + (edgeWarpNoise - 0.5) * 0.1; // Subtle warp of the transition line position

    // Calculate the mix factor (0 = fully dark side, 1 = fully light side) based on warped position
    float mixFactor = smoothstep(transitionCenter - transitionWidth / 2.0,
                                 transitionCenter + transitionWidth / 2.0,
                                 warpedX);

    // Calculate distance to the transition center to add effects there
    float distToEdge = abs(warpedX - transitionCenter);
    float edgeBoost = smoothstep(transitionWidth / 1.5, 0.0, distToEdge); // Boost is highest at the center

    // --- Bi-Directional Push Calculation ---
    // Determine push direction: Right (1.0) for dark side, Left (-1.0) for light side
    // Use the mixFactor to blend between these directions.
    // Adjusted push directions slightly based on visual testing in non-shadertoy envs
    vec2 pushDirection = mix(vec2(-2.0, 0.0), vec2(-0.0, 0.0), mixFactor);

    // Calculate the push offset based on time, strength, and proximity to the edge
    // The push is stronger near the edge (using edgeBoost)
    vec2 pushOffset = pushDirection * pushStrength * time * (1.0 + edgeBoost * 0.5);

    // Apply this push offset to the previously warped noise coordinates
    vec2 pushed_uv = warped_uv + pushOffset;

    // --- Final Noise Calculation ---
    // Calculate the main FBM noise value using the *pushed* coordinates
    float n = fbm(pushed_uv);

    // --- Color Calculation ---
    // Dark side colors (purples, deep reds, blacks)
    vec3 darkColor = mix(vec3(0.01, 0.0, 0.02), vec3(0.3, 0.05, 0.4), n * 1.5); // Base colors
    darkColor = pow(darkColor, vec3(1.2)); // Increase contrast slightly

    // Light side colors (bright yellows, whites, cyans)
    vec3 lightColor = mix(vec3(0.5, 0.5, 0.8), vec3(1.0, 1.0, 0.95), n); // Base colors
    lightColor = pow(lightColor, vec3(0.8)); // Make it bloom slightly
    lightColor *= 1.2; // Increase overall brightness

    // --- Edge Effect ---
    // Add subtle cyan/electric sparks near the edge, more visible on dark side
    vec3 edgeSparks = vec3(0.5, 0.8, 1.0) * edgeBoost * pow(noise(uv * 30.0 + time * 5.0), 5.0) * 3.0;

     // Add general brightness boost at edge
    float brightnessBoost = edgeBoost * edgeIntensity * (0.5 + n * 0.5); // Noise influences boost

    // --- Combine Colors ---
    vec3 finalColor = mix(lightColor, darkColor, mixFactor);
    finalColor += edgeSparks * (1.0 - mixFactor); // Add sparks mainly on dark side near edge
    finalColor *= (1.0 + brightnessBoost * 0.5); // Apply brightness boost

    // Clamp and output final color
    // Use gl_FragColor (built-in)
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}