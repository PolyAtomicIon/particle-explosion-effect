import * as THREE from "three";
import CameraControls from "camera-controls";

export default class Core {
  constructor(options) {

    this.scene = new THREE.Scene();
    // this.scene.background = this.color("#ff00ff");

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = {
      x: 0,
      y: 0
    };
    this.touch = {
      x: 0,
      y: 0
    };
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
    // this.controls.minPolarAngle = degreeInRad;
    // this.controls.maxPolarAngle = degreeInRad;
    // this.controls.minAzimuthAngle = degreeInRad;
    // this.controls.maxAzimuthAngle = degreeInRad;
    this.controls.rotatePolarTo(degreeInRad, true);
    this.controls.draggingDampingFactor = 0.1;
    this.controls.azimuthRotateSpeed = 0.15;
    this.controls.polarRotateSpeed = 0.5;
    this.controls.restThreshold = 5;
    
    this.updateControls();

    this.time = 0;
    this.isPlaying = true;

    this.setLighting();

    const axesHelper = new THREE.AxesHelper(50);
    this.scene.add(axesHelper);

    window.addEventListener(
      'touchmove',
      this.TouchMoveManager.bind(this),
      false
    );
    window.addEventListener(
      'touchstart',
      this.TouchStartManager.bind(this),
      false
    );
    window.addEventListener('touchend', this.TouchEndManager.bind(this), false);
    window.addEventListener('click', this.ClickManager.bind(this), false);
  }

  ClickManager(event) {
    event.preventDefault();

    this.mouse.x =
      (event.offsetX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y =
      -(event.offsetY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.RaycastHandler();
  }

  TouchMoveManager(event) {
    event.preventDefault();
  }

  TouchStartManager(event) {
    const touch = event.changedTouches[0];
    if (touch.clientX && touch.clientY) {
      this.touch = {
        x: touch.clientX,
        y: touch.clientY
      };
    }
  }

  TouchEndManager(event) {
    const touch = event.changedTouches[0];

    if (
      !touch ||
      !this.touch ||
      event.target.tagName === 'A' ||
      event.target.tagName === 'BUTTON'
    )
      return;

    const diff = {
      x: Math.abs(this.touch.x - touch.clientX),
      y: Math.abs(this.touch.y - touch.clientY)
    };

    // if user drags
    if (diff.x > 0.2 || diff.y > 0.2) return;

    this.mouse.x =
      (touch.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.mouse.y =
      -(touch.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.RaycastHandler();
  }

  RaycastHandler() {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const intersects = this.raycaster.intersectObjects(
      this.scene.children,
      true
    );
    console.log('🐞: Core -> ClickManager -> intersects', intersects);
    // console.log(intersects[0].point)

    for (let i = 0; i < intersects.length; i++) {
      if (intersects[i].object.callback) {
        intersects[i].object.callback();
        return;
      }
    }

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
