import * as THREE from "three";
import CameraControls from "camera-controls";
const createInputEvents = require("simple-input-events");

export default class Core {
  constructor(options) {

    this.scene = new THREE.Scene();
    // this.scene.background = this.color("#ff00ff");

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.container = options.dom;
    this.width = this.container.offsetWidth || this.container.innerWidth;
    this.height = this.container.offsetHeight || this.container.innerHeight;
    this.aspect = this.width / this.height;

    // console.log(this.height, this.width)

    this.renderer = new THREE.WebGLRenderer({
      transparent: true,
      alpha: true,
    });

    // this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0x000000, 1);
    // this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = false;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    this.container.appendChild(this.renderer.domElement);
    this.event = createInputEvents(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.aspect,
      0.0001,
      10000
    );

    this.camera.position.set(
      -50,
      140,
      -15
    );
    this.camera.aspect = this.width / this.height;

    CameraControls.install({ THREE: THREE });
    this.controls = new CameraControls(this.camera, this.renderer.domElement);
    this.controls.setTarget(0, 0, 0, true);
    const degreeInRad = THREE.MathUtils.degToRad(25);
    this.controls.minPolarAngle = degreeInRad;
    this.controls.maxPolarAngle = degreeInRad;
    this.controls.minAzimuthAngle = degreeInRad;
    this.controls.maxAzimuthAngle = degreeInRad;
    this.controls.rotatePolarTo(degreeInRad, true);
    this.updateControls();

    this.time = 0;
    this.isPlaying = true;

    this.setLighting();

    const axesHelper = new THREE.AxesHelper(50);
    this.scene.add(axesHelper);

  }

  setLighting() {
    this.scene.add(new THREE.AmbientLight(0x404040));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    this.camera.add(pointLight);
  }

  color(color) {
    return new THREE.Color(color);
  }

  fixHeightProblem() {
    // The trick to viewport units on mobile browsers
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this), false);
  }

  resize() {
    this.fixHeightProblem();

    this.width = this.container.offsetWidth || this.container.innerWidth;
    this.height = this.container.offsetHeight || this.container.innerHeight;
    this.renderer.setSize(this.width, this.height);
    this.renderer.render(this.scene, this.camera);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  updateControls() {
    this.controls.update(this.clock.getDelta());
  }

  renderManager() {
    if (!this.isPlaying) return;
    this.time += 0.01;

    this.renderer.clear();
    this.renderer.clearDepth();

    this.updateControls();
  }

}
