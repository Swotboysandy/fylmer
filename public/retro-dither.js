(function () {
  const hero = document.querySelector(".hero-section");
  const canvas = document.querySelector(".retro-dither-canvas");
  if (!hero || !canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
  if (!gl) return;

  const vertexSource = `#version 300 es
    in vec2 aPosition;
    out vec2 vUv;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    in vec2 vUv;
    out vec4 outColor;
    uniform sampler2D uImage;
    uniform vec2 uResolution;
    uniform vec2 uImageSize;
    uniform vec2 uPointer;
    uniform float uActive;
    uniform float uTime;

    float bayer(ivec2 p) {
      int values[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
      return (float(values[(p.y & 3) * 4 + (p.x & 3)]) + 0.5) / 16.0;
    }

    vec2 coverUv(vec2 uv) {
      float screenAspect = uResolution.x / uResolution.y;
      float imageAspect = uImageSize.x / uImageSize.y;
      vec2 scale = screenAspect > imageAspect
        ? vec2(1.0, imageAspect / screenAspect)
        : vec2(screenAspect / imageAspect, 1.0);
      return (uv - 0.5) * scale + 0.5;
    }

    void main() {
      vec2 frag = gl_FragCoord.xy;
      float pixelSize = 4.0;
      vec2 cell = floor(frag / pixelSize) * pixelSize + pixelSize * 0.5;
      vec2 pixelUv = cell / uResolution;
      vec3 original = texture(uImage, coverUv(vUv)).rgb;
      vec3 sampled = texture(uImage, coverUv(pixelUv)).rgb;

      float luminance = dot(sampled, vec3(0.299, 0.587, 0.114));
      luminance = clamp((luminance - 0.5) * 0.9 + 0.5, 0.0, 1.0);
      float levels = 4.0;
      float stepped = floor(luminance * levels + step(bayer(ivec2(cell / pixelSize)), fract(luminance * levels))) / levels;
      vec3 palette = mix(vec3(0.018, 0.055, 0.043), vec3(0.80, 0.75, 0.48), stepped);
      vec3 dithered = mix(sampled, palette, 0.34);

      vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
      float distanceToPointer = length((vUv - uPointer) * aspect);
      float lens = 1.0 - smoothstep(0.16, 0.42, distanceToPointer);
      lens *= uActive;
      float scanline = sin(frag.y * 3.14159265) * 0.018;
      float base = 0.08;
      float strength = max(base, lens * 0.92);
      vec3 color = mix(original, dithered - scanline, strength);
      color += sin((frag.x + frag.y) * 0.35 + uTime * 2.0) * 0.004 * strength;
      outColor = vec4(color, 1.0);
    }
  `;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader));
    }
    return shader;
  };

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn("Retro dither unavailable:", error);
    canvas.hidden = true;
    return;
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const locations = {
    resolution: gl.getUniformLocation(program, "uResolution"),
    imageSize: gl.getUniformLocation(program, "uImageSize"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    active: gl.getUniformLocation(program, "uActive"),
    time: gl.getUniformLocation(program, "uTime"),
  };

  const pointer = { x: 0.56, y: 0.48, tx: 0.56, ty: 0.48, active: 0.7, target: 0.7 };
  const image = new Image();
  image.src = "./assets/hero.webp";
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    requestAnimationFrame(render);
  };

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.tx = (event.clientX - rect.left) / rect.width;
    pointer.ty = 1 - (event.clientY - rect.top) / rect.height;
    pointer.target = 1;
  });
  hero.addEventListener("pointerleave", () => { pointer.target = 0.35; });
  hero.addEventListener("pointerenter", () => { pointer.target = 1; });
  window.addEventListener("resize", resize, { passive: true });
  resize();

  function render(now) {
    pointer.x += (pointer.tx - pointer.x) * 0.075;
    pointer.y += (pointer.ty - pointer.y) * 0.075;
    pointer.active += (pointer.target - pointer.active) * 0.065;
    gl.uniform2f(locations.resolution, canvas.width, canvas.height);
    gl.uniform2f(locations.imageSize, image.naturalWidth, image.naturalHeight);
    gl.uniform2f(locations.pointer, pointer.x, pointer.y);
    gl.uniform1f(locations.active, pointer.active);
    gl.uniform1f(locations.time, now * 0.001);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }
})();
