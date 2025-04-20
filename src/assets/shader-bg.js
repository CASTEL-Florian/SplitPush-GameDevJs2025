// WebGL shader background renderer
const shaderUrl = 'assets/backgroundShader.frag';

async function fetchShader(url) {
    const response = await fetch(url);
    return await response.text();
}

async function setupShaderBackground() {
    const canvas = document.createElement('canvas');
    canvas.id = 'shader-bg-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '-1';
    canvas.style.pointerEvents = 'none';
    document.body.prepend(canvas);

    const gl = canvas.getContext('webgl');
    if (!gl) return;
    const fragShaderSrc = await fetchShader(shaderUrl);
    const vertShaderSrc = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vShader, fShader) {
        const program = gl.createProgram();
        gl.attachShader(program, vShader);
        gl.attachShader(program, fShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link failed:', gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertShaderSrc);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSrc);
    const program = createProgram(gl, vertShader, fragShader);
    gl.useProgram(program);

    // Fullscreen quad
    const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const uTimeLoc = gl.getUniformLocation(program, 'u_time');
    const uResLoc = gl.getUniformLocation(program, 'u_resolution');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    let start = null;
    function render(now) {
        if (!start) start = now;
        const t = (now - start) * 0.001;
        gl.uniform1f(uTimeLoc, t);
        gl.uniform2f(uResLoc, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

window.addEventListener('DOMContentLoaded', setupShaderBackground);
