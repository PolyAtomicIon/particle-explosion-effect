import * as THREE from "three";
import CameraControls from "camera-controls";

export default class Core {
  constructor(options) {

    this.scene = new THREE.Scene();
    // this.scene.background = this.color("#ff00ff");

    this.container = options.dom;
    this.width = this.container.offsetWidth || this.container.innerWidth;
    this.height = this.container.offsetHeight || this.container.innerHeight;
    this.aspect = this.width / this.height;

    this.clock = new THREE.Clock();
    this.raycaster = new THREE.Raycaster();
    this.mouse = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
    };
    this.touch = {
      x: 0,
      y: 0
    };
    this.pointer = new THREE.Vector2();
    this.time = 0;
    this.cameraMoving = 0;
    this.isPlaying = true;
    this.isDetailedViewActive = false;
    this.onResizeEvents = [];
    this.onRenderEvents = [];

    this.setRenderer();
    this.setCamera();

    CameraControls.install({ THREE: THREE });
    this.controls = new CameraControls(this.camera, this.renderer.domElement);
    this.setCameraControls();

    this.setLighting();
    this.setEventListeners();
  }

  setRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      transparent: true,
      alpha: true,
      antialias: true,
    });
    // this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0x000000, 1);
    // this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.autoClear = false;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.container.appendChild(this.renderer.domElement);
  }

  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.aspect,
      0.00001,
      1000
    );
    this.camera.position.set(
      0,
      95,
      0
    );
    this.camera.aspect = this.aspect;
  }

  setCameraControls() {
    this.controls.setTarget(0, 0, 0);
    this.controls.draggingDampingFactor = 0.05;
    this.controls.mouseButtons.left = CameraControls.ACTION.NONE;

    this.initialDegreeInRad = THREE.MathUtils.degToRad(30);
    this.controls.rotatePolarTo(this.initialDegreeInRad,);
    this.updateCameraControlsRotationLimits();

    // this.controls.truck(0, 18);

    this.updateControls();
  }

  updateCameraControlsRotationLimits() {
    const isCameraMovementFinished = (this.time - this.cameraMoving <= 0.05);
    if (!isCameraMovementFinished)
      return;

    const deltaDegree = this.isDetailedViewActive ? 1.5 : 7.;
    this.updateAzimuthAngle(deltaDegree * 1.5);
    this.updatePolarAngle(deltaDegree);
  }

  updateAzimuthAngle(deltaDegree = 1.5) {
    this.controls.normalizeRotations();
    const currentAzimuthAngle = this.controls.azimuthAngle;
    const deltaAngle = THREE.MathUtils.degToRad(deltaDegree);

    this.controls.minAzimuthAngle = currentAzimuthAngle - deltaAngle;
    this.controls.maxAzimuthAngle = currentAzimuthAngle + deltaAngle;
  }

  updatePolarAngle(deltaDegree = 1.5) {
    const currentPolarAngle = this.controls.polarAngle;
    const deltaAngle = THREE.MathUtils.degToRad(deltaDegree);

    this.controls.minPolarAngle = currentPolarAngle - deltaAngle;
    this.controls.maxPolarAngle = currentPolarAngle + deltaAngle;
  }

  setCameraControlsSpeed({
    restThreshold = 0.05,
    dampingFactor = 0.05
  }) {
    this.controls.dampingFactor = dampingFactor;
    this.controls.restThreshold = restThreshold;
  }

  enableCameraMovement(duration = 2) {
    this.cameraMoving = this.time + duration;
  }

  resetCameraControlsRotationLimits() {
    this.controls.minPolarAngle = -Infinity;
    this.controls.maxPolarAngle = Infinity;
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
  }

  setLighting() {
    this.scene.add(new THREE.AmbientLight(0x404040));
    const pointLight = new THREE.PointLight(0xffffff, 1);
    this.camera.add(pointLight);
  }

  setEventListeners() {
    window.addEventListener(
      'pointermove',
      this.onPointerMove.bind(this),
    );
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

  onPointerMove(event) {
    const isCameraMoving = (this.time < this.cameraMoving);
    if (event.isPrimary === false || isCameraMoving) {
      // cancel action
      this.mouse.x = 0;
      this.mouse.y = 0;
      return;
    }

    this.mouse.x =
      event.clientX - this.width / 2;
    this.mouse.y =
      event.clientY - this.height / 2;
  }

  ClickManager(event) {
    // event.preventDefault();

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

    this.touch.x =
      (touch.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
    this.touch.y =
      -(touch.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

    this.RaycastHandler();
  }

  RaycastHandler() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    this.mouse.x = 0;
    this.mouse.y = 0;

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

  color(color) {
    return new THREE.Color(color);
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

    this.onResizeEvents.forEach(fn => {
      fn({
        x: this.width,
        y: this.height
      });
    });

    this.renderer.render(this.scene, this.camera);
  }

  fixHeightProblem() {
    // The trick to viewport units on mobile browsers
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
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

  moveCameraOnPointerMove() {
    const isActionCancelled = (this.mouse.x == 0);
    if (isActionCancelled) {
      return;
    }

    const speed = 0.1;
    const cameraPos = this.controls.camera.position;

    let deltaX = (this.mouse.x - cameraPos.x) * speed;
    let deltaY = (-this.mouse.y - cameraPos.y) * speed;

    const degreeInRad = THREE.MathUtils.degToRad(0.5);
    this.controls.rotate(
      deltaX * degreeInRad,
      deltaY * degreeInRad,
      true
    );
  }

  renderManager() {
    if (!this.isPlaying) return;

    this.onRenderEvents.forEach(fn => {
      fn(this.time);
    });

    this.renderer.clear();
    this.renderer.clearDepth();

    this.time += 0.01;
    this.updateControls();
  }

}
