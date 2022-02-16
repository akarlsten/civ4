class EarthScene {

  constructor(renderer, camera, controls, objects, onAnimationDoneCallback) {
    this.renderer = renderer
    this.camera = camera
    this.controls = controls
    this.objects = objects
    this.onAnimationDoneCallback = onAnimationDoneCallback

    this.spaceCubeMap = objects['milkyway']
    this.falconModel = objects['falconheavy']

    this.firstRender = true
    this.elapsedTime = 0

    // Animation stuff
    this.animationDone = false
    this.animSeconds = 10
    this.cameraAnimPosSpline = new CatmullRomCurve3([
      new Vector3(10.0, 30.0, 30.0),
      new Vector3(18.0, 10.0, 0.0),
    ])
    this.cameraAnimLookatSpline = new CatmullRomCurve3([
      new Vector3(0.0, 0.0, 0.0),
      new Vector3(-10.0, 5.0, 0.0),
    ])

    this.materialShaders = []

    this.scene = this.setupScene()
  }

  setupScene() {
    const scene = new Scene()
    scene.background = this.spaceCubeMap

    // Wireframe
    // let geometry = new THREE.SphereGeometry(12, 16, 16);
    // let wireframeGeometry = new THREE.WireframeGeometry( geometry );
    // let wireframeMaterial = new THREE.LineBasicMaterial({
    //   color: 0x44ff44,
    //   linewidth: 1,
    // });

    // this.wireframeLines = new THREE.LineSegments( wireframeGeometry, wireframeMaterial );
    // this.wireframeLines.material.depthTest = true;
    // this.wireframeLines.material.opacity = 0.75;
    // this.wireframeLines.material.transparent = true;

    this.controls.minDistance = 25
    this.controls.update()

    // Atmosphere
    let atmosGeometry = new SphereGeometry(10.3, 64, 64)
    let atmosMaterial = new MeshPhongMaterial({
      transparent: true,
      depthWrite: false,
    })
    this.atmosMesh = new Mesh(atmosGeometry, atmosMaterial)

    atmosMaterial.onBeforeCompile = shader => {
      // Place at end of Three JS fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(`gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
        `
          float l = (dot(directLight.direction, vNormal) + 1.0) * 0.7;
          float p = pow3(1.0 - dot( normalize(vViewPosition), vNormal)) ;
          if (p>0.5) {
            // Fade out the outer edge of the geometry
            gl_FragColor = vec4( vec3(0.3, 0.5, 1.0), 1.0 - p) * l;
          } else {
            // Fade in from center to outer edge
            gl_FragColor = vec4( vec3(0.3, 0.5, 1.0), p) * l;
          }
          `
      )
    }

    // Clouds
    let cloudGeometry = new SphereGeometry(10.1, 64, 64)
    let cloudMaterial = new MeshPhongMaterial({
      map: this.objects['earth-clouds'],
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    })
    this.cloudMesh = new Mesh(cloudGeometry, cloudMaterial)

    // Earth
    let earthGeometry = new SphereGeometry(10, 64, 64)
    let earthMaterial = new MeshPhongMaterial()
    earthMaterial.map = this.objects['earth-day']
    earthMaterial.bumpMap = this.objects['earth-bump']
    earthMaterial.bumpScale = 0.2
    earthMaterial.specularMap = this.objects['earth-specular']
    earthMaterial.specular = new Color('grey')

    earthMaterial.onBeforeCompile = shader => {
      shader.uniforms.uNightTexture = {
        type: "t",
        value: this.objects['earth-night']
      }
      shader.uniforms.uNightLightIntensity = {
        value: 1.0
      }


      // Place before Three JS vertexShader
      shader.vertexShader =
        ` uniform sampler2D uNightTexture;
          uniform float uNightLightIntensity;
        ` + shader.vertexShader

      // Replace the end of Three JS vertexShader
      shader.vertexShader = shader.vertexShader.replace(`#include <begin_vertex>`,
        `#include <begin_vertex>
          //vNormal = normal; // <= DON'T use. vNormal is already available
          `
      )

      // Place before Three JS fragmentShader
      shader.fragmentShader =
        `
          uniform sampler2D uNightTexture;
          uniform float uNightLightIntensity;
        ` + shader.fragmentShader

      // Place at end of Three JS fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace(`gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,
        `
          float inverseLightPercentage = dot(directLight.direction, -vNormal);
          float noLightPercentage = max(0.0, inverseLightPercentage);

          vec4 nightTexel = texture2D(uNightTexture, vUv);
          vec4 extraTexel = ( clamp(nightTexel, 0.3, 1.0) - vec4(0.3) ) * 10.0 * uNightLightIntensity; 
          vec4 mixNightTexel = mix(nightTexel, extraTexel, 0.7);
          //vec4 mixNightTexel = vec4(vUv.x, extraTexel.g, extraTexel.b, extraTexel.a);

          vec3 result = mix(outgoingLight, mixNightTexel.xyz, noLightPercentage);
          gl_FragColor = vec4( result, diffuseColor.a );
          `
      )

      this.materialShaders.push(shader)
    }

    this.earthMesh = new Mesh(earthGeometry, earthMaterial)
    //this.earthMesh.add(this.wireframeLines);
    this.earthMesh.add(this.atmosMesh)
    this.earthMesh.add(this.cloudMesh)
    scene.add(this.earthMesh)

    // Camera
    this.camera.position.set(0, 10, 19)
    this.camera.lookAt(scene.position)

    // Lights
    {
      const color = 0xFFFFFF
      const intensity = .2
      const light = new AmbientLight(color, intensity)
      scene.add(light)
    }

    this.sunLight
    {
      const color = 0xFFFFFF
      const intensity = 1.3
      this.sunLight = new DirectionalLight(color, intensity)
      this.sunLight.position.set(1000, 0, 0)
      this.sunLight.target.position.set(0, 0, 0)
      scene.add(this.sunLight)
    }

    return scene
  }

  setModels() {
    // this.falconModel.position.y = 0;
    // this.falconModel.scale.set(1.8, 1.8, 1.8);
    // this.scene.add(this.falconModel);
  }

  renderFrame(delta) {
    const audioFft = this._readAudio()
    this._updateSceneAnimation(delta, audioFft)
  }

  _updateSceneAnimation(delta, audioFft) {
    this.elapsedTime += delta

    if (this.firstRender) {
      this.controls.autoRotateSpeed = -.03
      //this.controls.autoRotateSpeed = 0;
      this.firstRender = false
    }

    this.cloudMesh.rotation.y -= .010 * delta
    this.cloudMesh.rotation.x -= .015 * delta
    this.earthMesh.rotation.y -= .015 * delta

    // this.wireframeLines.material.opacity = Math.random();
    // this.wireframeLines.rotation.y -= .05 * delta;
    // this.wireframeLines.rotation.x -= .05 * delta;

    this.sunLight.position.x = 500 * Math.sin(this.elapsedTime / 2)
    this.sunLight.position.z = 500 * Math.cos(this.elapsedTime / 3)

    // NB. controls.update() altijd voor camera.lookAt() plaatsen
    this.controls.update(delta)

    // Animate for animSeconds seconds
    let t = this.elapsedTime / this.animSeconds
    if (t < 1.0) {
      this.controls.enabled = false
      let p = EasingFunctions.easeInOutQuint(t)
      let v = this.cameraAnimPosSpline.getPoint(p)
      this.camera.position.set(v.x, v.y, v.z)
      this.controls.target = this.cameraAnimLookatSpline.getPoint(p)
    } else if (!this.animationDone) {
      this.animationDone = true
      this.controls.enabled = true
      this.onAnimationDoneCallback()
    }

    // Send uniforms to shader
    this.materialShaders.forEach(m => {
      m.uniforms.uNightLightIntensity.value = audioFft ? ((audioFft[0] / 255) - 0.3) * 4.0 : 1.0//(Math.sin(this.elapsedTime*12) + 1.5) / 2.5;
    })
  }

  setFFTAnalyser(analyser) {
    this.analyser = analyser
  }

  _readAudio() {
    if (this.analyser == null)
      return

    const bufferLength = this.analyser.frequencyBinCount
    const fftArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(fftArray)

    this._flattenCurve(fftArray)
    const interpolatedArray = new Uint8Array(40)
    return Utils.typedInputArrayToInterpolatedTypedArray(fftArray, 0, interpolatedArray)
  }

  _flattenCurve(dataArray) {
    for (let i = 0; i < dataArray.length; i++) {
      let v = dataArray[i]

      // Flatten the frequency curve
      v *= 0.7 + i / dataArray.length

      // Ditch the lower (always-on) part
      v -= 50

      // Movement over entire height (not just lower part)
      v *= 2.0

      // Prevent clipping
      if (v <= 0) {
        v = 0
      }
      if (v > 250) {
        v = 250
      }

      dataArray[i] = v
    }
  }

}
// CONCATENATED MODULE: .

// Globals
const PIXEL_RATIO = 1.0
const stats = null//new Stats();
let camera
let scene
let postprocessing
let fadeAmount
const clock = new Clock()


// Full screen (un)set
function fullscreenHandler() {
  if (document.fullscreenElement != null) {
    document.exitFullscreen()
    fullscreenToggle.src = "./images/bar/fullscreen.min.svg"
  } else {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
      fullscreenToggle.src = "./images/bar/fullscreen-exit.min.svg"
    }
  }
}


// Menu pane
const menuElm = document.getElementById("menu")

function showMenu() {
  menuElm.classList.add("show")
  menuElm.classList.remove("hide")
  hideExplain()
}
function hideMenu() {
  menuElm.classList.add("hide")
  menuElm.classList.remove("show")
}
const playElm = document.getElementById("play")
playElm.addEventListener("click", () => {
  hideMenu()
  setTimeout(showExplain, 500)
  startAudio()
})



// Explain pane
const explainElm = document.getElementById("explain")

function showExplain() {
  explainElm.classList.add("show")
  explainElm.classList.remove("hide")
  hideMenu()
}
function hideExplain() {
  explainElm.classList.add("hide")
  explainElm.classList.remove("show")
}
const goElm = document.getElementById("go")
goElm.addEventListener("click", () => {
  hideExplain()
  showOverlayForAWhile()
})


// Helper bar pane 
const overlayElm = document.getElementById("overlay")

function showOverlayForAWhile() {
  overlayElm.classList.add("showVisible")
  setTimeout(hideOverlay, 3000)
}
function hideOverlay() {
  overlayElm.classList.remove("showVisible")
}

// Helper bar toggles
const menuToggle = document.getElementById("menuToggle")
menuToggle.addEventListener("click", showMenu)

const explainToggle = document.getElementById("explainToggle")
explainToggle.addEventListener("click", showExplain)

const fullscreenToggle = document.getElementById("fullscreenToggle")
fullscreenToggle.addEventListener("click", fullscreenHandler)




let audioGain = 1.0
let audioWidth = 1.0

// Function called from click event: https://developer.chrome.com/blog/autoplay/#webaudio
function startAudio() {
  // Audio
  let audioCtx = new (window.AudioContext || window.webkitAudioContext)()

  // TODO: https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode
  let whiteNoise = audioCtx.createScriptProcessor(0, 0, 2) // buffersize by system
  whiteNoise.onaudioprocess = function (e) {
    let outputL = e.outputBuffer.getChannelData(0)
    let outputR = e.outputBuffer.getChannelData(1)
    for (let i = 0; i < outputL.length; i++) {
      let left = (Math.random() * 2 - 1) * audioGain
      let right = (Math.random() * 2 - 1) * audioGain

      outputL[i] = left + (right * audioWidth)
      outputR[i] = right + (left * audioWidth)
    }
  }

  let biquadFilter = audioCtx.createBiquadFilter()
  biquadFilter.type = "lowpass"
  biquadFilter.frequency.setValueAtTime(15, audioCtx.currentTime)

  whiteNoise.connect(biquadFilter)
  biquadFilter.connect(audioCtx.destination)
}





// Window resize handling
window.addEventListener('resize', () => {
  resetCamera()
}, false)

function resetCamera(width = window.innerWidth, height = window.innerHeight) {
  postprocessing.setSize(width, height)

  camera.aspect = width / height
  camera.updateProjectionMatrix()
}


// Renderer
const renderer = new WebGLRenderer({
  powerPreference: "high-performance",
  antialias: false,
  stencil: false,
  depth: false
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(PIXEL_RATIO)


// Texture loading
let loaderElm = document.getElementById("loader")
let loadingProgressElm = document.getElementById("loadingProgress")
const loader = new Loader_Loader(init, percentage => {
  loadingProgressElm.setAttribute("value", percentage)
  if (percentage >= 100) {
    loaderElm.classList.add("hide")
  }
})
loader.loadTexture('textures/planets/earth_night_lights_2048.jpg', "earth-night")
loader.loadTexture('textures/planets/earth_atmos_2048.jpg', "earth-day")
loader.loadTexture('textures/planets/depthmap-earth4096.png', "earth-bump")
loader.loadTexture('textures/planets/earth_specular_2048.jpg', "earth-specular")
loader.loadTexture('textures/planets/earth_clouds_1024.png', "earth-clouds")
loader.loadCubeTexture('textures/milkyway-small/', "milkyway", "png") // https://jaxry.github.io/panorama-to-cubemap/


// Init ThreeJS scene (texture loading callback)
function init(loadedModels) {
  camera = new three_module_PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 10000)

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.autoRotate = true

  // Scene
  scene = new EarthScene(renderer, camera, controls, loadedModels, showMenu)
  scene.setModels()

  // Postprocessing
  postprocessing = new Postprocessing(renderer, camera, {
    smaa: { enabled: false },
    vignette: { enabled: true },
    bloom: { enabled: true },
    scanlines: { enabled: true },
    noise: { enabled: false },
    glitch: { enabled: false },
    fade: { enabled: true },
  })
  postprocessing.setScene(scene.scene)
  fadeAmount = -.15 // Start before zero to postpone fading in

  // Show on screen
  document.body.appendChild(renderer.domElement)
  stats && document.body.appendChild(stats.dom)


  // Start render loop
  render()
}



// Render-cycle
function render() {
  stats && stats.begin()

  let delta = clock.getDelta()
  scene.renderFrame(delta)

  // Render scene and postprocessing
  postprocessingAnimation(delta)
  postprocessing.render(delta)

  // Register for next animation
  requestAnimationFrame(render)

  // Audio
  let distance = camera.position.distanceTo(new Vector3(0, 0, 0))
  audioGain = Math.max(0, Math.min(10.0, 1.0 / distance)) * 30
  audioWidth = audioGain * 1.5 // Same value works well

  stats && stats.end()
}

function postprocessingAnimation(delta) {
  if (postprocessing.fade && fadeAmount <= 1.0) {
    fadeAmount += delta * 0.2
    postprocessing.fade.setFade(fadeAmount)
  }
}
/******/ }) ()
