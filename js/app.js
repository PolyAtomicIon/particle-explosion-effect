import * as THREE from "three";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import GUI from "lil-gui";
import Core from './core';
import ParticleCloud from "./particleCloud";
import StarFall from "./starfall";
import ParticleCloudC from "./icon1.glb";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from "gsap";

export default class Sketch extends Core {
  constructor(options) {
    super(options);
    this.meshes = [];
    this.points = [
      { x: 0, y: 0, z: 0 },
      { x: 40, y: 0, z: 0 },
      { x: -40, y: 0, z: 0 },
      { x: 0, y: 0, z: 40 },
      { x: 0, y: 0, z: -40 },
      { x: 20, y: 0, z: 20 },
      { x: -20, y: 0, z: 20 },
      { x: 20, y: 0, z: -20 },
      { x: -20, y: 0, z: -20 },
    ];
    this.currentActiveTargetIndex = null;
    this.resetCameraControlsRotationLimits();

    this.setGuiSettings();

    this.particleCloud = new ParticleCloud();
    this.onResizeEvents.push(this.particleCloud.resize.bind(this.particleCloud));
    this.onRenderEvents.push(this.particleCloud.render.bind(this.particleCloud));
    this.onRenderEvents.push(this.applyHoverEffect.bind(this));

    this.starFall = new StarFall();
    this.onRenderEvents.push(this.starFall.render.bind(this.starFall));

    this.setCameraControlsSpeed({
      restThreshold: 5,
      dampingFactor: 0.025,
      dollySpeed: 0.7,
      azimuthRotateSpeed: 1,
      polarRotateSpeed: 0.5,
    });

    // this.addObjects();
    // this.addBillboard();
    this.addStarFall();

    gsap.delayedCall(1, () => {
      this.starFall.play();
    });


    gsap.delayedCall(2.5, () => {
      this.time = 0;
      this.isPlaying = true;
      this.addObjects();
      this.addBillboard();
    });

    gsap.delayedCall(3.7, () => {
      this.starFall.stop();
      console.log(this.time)
      this.controls.rotatePolarTo(this.initialPolarDegreeInRad, true);
    });

    this.setPostProcessing();
    this.setupResize();
    this.resize();
    this.render();

    const loader = new GLTFLoader();

    loader.load(
      ParticleCloudC,
      (gltf) => {
        // console.log(gltf.animations)
        // this.scene.add(gltf.scene);
        this.mainMesh = gltf.scene;
        gltf.animations; // Array<THREE.AnimationClip>
        this.updateObjectMaterial(this.mainMesh);

        this.addPointsForCamera();
        // gltf.scene; // THREE.Group
        // gltf.scenes; // Array<THREE.Group>
        // gltf.cameras; // Array<THREE.Camera>
        // gltf.asset; // Object

      }
    );
  }

  setPostProcessing() {
    const renderScene = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(this.width, this.height), 1.5, 0.4, 0.85);
    this.bloomPass.threshold = this.settings.bloomThreshold;
    this.bloomPass.strength = this.settings.bloomStrength;
    this.bloomPass.radius = this.settings.bloomRadius;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);
  }

  setGuiSettings() {
    this.settings = {
      morph: false,
      exposure: 1,
      bloomStrength: 1.0,
      bloomThreshold: 0,
      bloomRadius: 0,
      point1: false,
      point2: false,
      point3: false,
      point4: false,
      point5: false,
      point6: false,
      point7: false,
      point8: false,
      point9: false,
      truck1: false,
      truck2: false,
    };
    this.gui = new GUI();
    this.points.forEach((point, index) => {
      this.gui.add(this.settings, "point" + (index + 1).toString()).onChange(() =>
        this.onTargetChosen(point, index)
      )
    })
    this.gui.add(this.settings, "morph").onChange(() => {
      this.morph();
    });
    this.gui.add(this.settings, 'exposure', 0.1, 2).onChange((value) => {
      this.changeExposure(value);
    });
    this.gui.add(this.settings, 'bloomThreshold', 0.0, 1.0).onChange((value) => {
      this.bloomPass.threshold = Number(value);
    });
    this.gui.add(this.settings, 'bloomStrength', 0.0, 3.0).onChange((value) => {
      this.changeBloomStrength(value);
    });
    this.gui.add(this.settings, 'bloomRadius', 0.0, 1.0).step(0.01).onChange((value) => {
      this.bloomPass.radius = Number(value);
    });
    this.gui.add(this.settings, 'truck1').onChange(() => {
      this.controls.truck(2, 0, true);
    });
    this.gui.add(this.settings, 'truck2').onChange(() => {
      this.controls.truck(-2, 0, true);
    });
  }

  morph() {
    if (!this.particleCloud.isMorphingEnabled) {
      this.changeExposure(0.45);
      this.changeBloomStrength(0.5);
    }
    else {
      this.changeExposure(.9);
      this.changeBloomStrength(1.);
    }
    this.particleCloud.morph(this.time);
  }

  changeExposure(value) {
    gsap.to(this.renderer, {
      toneMappingExposure: Math.pow(value, 4.0),
      duration: 0.5,
    })
  }

  changeBloomStrength(value) {
    gsap.to(this.bloomPass, {
      strength: Number(value),
      duration: 0.5,
    })
  }

  async onTargetChosen(point, index) {
    if (this.currentActiveTargetIndex)
      this.meshes[this.currentActiveTargetIndex].visible = false;

    if (index == 0) {
      this.currentActiveTargetIndex = null;
      this.camerResetAnimation();
    }
    else {
      this.currentActiveTargetIndex = index;
      this.cameraAnimation(point);
      this.meshes[index].visible = true;
    }
  }

  async cameraAnimation(
    position = { x: 0, y: 0, z: 0 }
  ) {
    this.isDetailedViewActive = true;

    if (!this.particleCloud.isMorphingEnabled) {
      this.settings.morph = true;
      this.gui.morph = true;
      this.morph();
    }

    this.changeExposure(0.4);
    this.enableCameraMovement(1.2);
    this.resetCameraControlsRotationLimits();


    let azimuthAngle = this.getAngleBetweenTwoVectorsInRad(position);
    const polarAngle = THREE.MathUtils.degToRad(90);

    await Promise.all([
      this.controls.moveTo(position.x, position.y + 20, position.z, true),
      this.controls.rotatePolarTo(polarAngle, true),
      this.controls.rotateAzimuthTo(azimuthAngle, true),
      this.controls.dollyTo(8, true),
      this.controls.setFocalOffset(this.horizonalOffset, 0, 0, true)
    ]);

    this.updateControls();
  }

  async camerResetAnimation() {
    if (!this.isDetailedViewActive) {
      return;
    }

    if (this.particleCloud.isMorphingEnabled) {
      this.settings.morph = false;
      this.gui.morph = false;
      this.morph();
    }

    this.isDetailedViewActive = false;

    this.enableCameraMovement(1.);
    this.resetCameraControlsRotationLimits();
    this.controls.setFocalOffset(0, 0, 0, true);

    await Promise.all([
      this.controls.setTarget(0, 0, 0, true),
      this.controls.setLookAt(0, 0, 0, 0, 0, 0, true),
      this.controls.reset(true),
      this.controls.rotatePolarTo(this.initialPolarDegreeInRad, true),
    ]);

    this.updateControls();
  }

  updateObjectMaterial(object) {
    if (object.children) {
      object.layers.set(1);
    }

    if (object.material) {
      object.material.toneMapped = false;
      object.material.roughness = 5;
      object.material.depthTest = false;
      object.material.envMap = false;
      object.material.flatShading = false;
      object.material.depthWrite = false;
      object.material.needsUpdate = true;
    }

    object.children.forEach(child =>
      this.updateObjectMaterial(child)
    );

  }

  addObjects() {
    const count = 8500;
    const duration = 0.9;
    const speed = 1.9;
    // const speed = 0;

    this.particleCloud.createShaderMaterial(
      { x: this.width, y: this.height },
      duration,
      speed,
      0
    );

    let minRadius = 0.01;
    let maxRadius = 0.5;
    const minGapRadius = 0.02;
    const maxGapRadius = 0.3;

    for (let i = 0; i < 3; i++) {

      let mesh = this.particleCloud.createParticleCloud(
        count,
        minRadius,
        maxRadius,
      );

      this.scene.add(mesh);

      minRadius = maxRadius + minGapRadius;
      maxRadius = maxRadius + maxGapRadius;
    }

  }

  addBillboard() {
    this.particleCloud.createBillboardMaterial(
      { x: this.width, y: this.height },
    );

    this.scene.add(this.particleCloud.createBillboard());
  }

  addStarFall() {
    const stars = this.starFall.createStarFall();
    this.scene.add(stars);
  }

  addPointsForCamera() {
    // const geometry = new THREE.BoxGeometry(3, 3, 3);

    for (let i = 0; i < this.points.length; i++) {
      // const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xebe1e1, transparent: false });
      // const mesh = new THREE.Mesh(geometry, material);

      const mesh = this.mainMesh.clone();

      mesh.position.x = this.points[i].x;
      mesh.position.y = this.points[i].y;
      mesh.position.z = this.points[i].z;
      mesh.position.y += 20;
      this.meshes.push(mesh);
      this.scene.add(mesh);
      mesh.visible = false;
      // const control = new TransformControls(this.camera, this.renderer.domElement);
      // control.attach(mesh);
      // this.scene.add(control);

      // control.addEventListener('dragging-changed', () => {
      //   console.log(mesh.position);
      // });
    }

  }

  applyHoverEffect() {
    const isCameraMoving = this.time < this.cameraMoving;
    if (isCameraMoving || !this.isPlaying)
      return;

    this.updateCameraControlsRotationLimits();
    this.moveCameraOnPointerMove();
  }

  render() {
    this.renderManager();

    this.renderer.clear();

    this.camera.layers.set(0);
    if (this.composer)
      this.composer.render();

    this.renderer.clearDepth();
    this.camera.layers.set(1);

    this.starFall.render(this.time)
    this.renderer.render(this.scene, this.camera)

    requestAnimationFrame(this.render.bind(this));
  }
}

const sketch = new Sketch({
  dom: document.getElementById("container"),
});

sketch.fixHeightProblem();
