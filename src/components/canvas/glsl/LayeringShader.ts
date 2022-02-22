export default {
  uniforms: {
    tDiffuse: { value: null },
    tOne: { value: null },
    tTwo: { value: null },
    tThree: { value: null }
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
    vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tOne;
    uniform sampler2D tTwo;
    uniform sampler2D tThree;

    varying vec2 vUv;
    void main() {
      vec4 cities = texture2D( tDiffuse, vUv );
      vec4 earth = texture2D( tOne, vUv );
      vec4 space = texture2D( tTwo, vUv);
      vec4 atmosphere = texture2D( tThree, vUv);

      vec4 wholeSpace = space + atmosphere;
      vec4 wholeEarth = cities + earth;

      gl_FragColor = wholeEarth * earth.a + wholeSpace * (1.0 - earth.a);
    }`
}
