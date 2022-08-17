import * as THREE from "three";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import GUI from "lil-gui";
import Core from './core';
import ParticleCloud from "./particleCloud";
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from "gsap";

export default class Sketch extends Core {
  constructor(options) {
    super(options);

    this.setGuiSettings();

    this.particleCloud = new ParticleCloud();
    this.onResizeEvents.push(() => {
      this.particleCloud.resize({
        x: this.width,
        y: this.height
      });
    });
    this.onRenderEvents.push(this.particleCloud.render.bind(this.particleCloud));
    this.onRenderEvents.push(this.applyHoverEffect.bind(this));

    this.addObjects();
    this.addBillboard();
    this.addPointsForCamera();

    this.setPostProcessing();
    this.setupResize();
    this.resize();
    this.render();
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
      bloomStrength: 1.2,
      bloomThreshold: 0,
      bloomRadius: 0
    };
    this.gui = new GUI();
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
  }

  morph() {
    if (!this.particleCloud.isMorphingEnabled) {
      this.changeExposure(0.45);
      this.changeBloomStrength(0.5);
    }
    else {
      this.changeExposure(.9);
      this.changeBloomStrength(1.2);
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

  async cameraAnimation(
    position = { x: 0, y: 0, z: 0 },
    rotationDegree = 87
  ) {
    this.isDetailedViewActive = true;

    if (!this.particleCloud.isMorphingEnabled) {
      this.settings.morph = true;
      this.gui.morph = true;
      this.morph();
    }

    const degreeInRad = THREE.MathUtils.degToRad(rotationDegree);
    const pos = this.controls._target;

    this.changeExposure(0.4);
    this.enableCameraMovement();
    this.resetCameraControlsRotationLimits();
    this.setCameraControlsSpeed({
      restThreshold: 3,
      dampingFactor: 0.03
    });

    await Promise.all([
      this.controls.moveTo(position.x, position.y, position.z, true),
      this.controls.dollyTo(25, true),
    ]);
    await Promise.all([
      this.controls.setLookAt(pos.x, pos.y, pos.z, 0, 0, 0, true),
      this.controls.rotatePolarTo(
        degreeInRad,
        true
      ),
      this.controls.dollyTo(55, true),
    ]);

    this.setCameraControlsSpeed({});
    this.updateControls();
  }

  async camerResetaAnimation(
  ) {
    if( !this.isDetailedViewActive ){
      return;
    }

    if (this.particleCloud.isMorphingEnabled) {
      this.settings.morph = false;
      this.gui.morph = false;
      this.morph();
    }

    const rotationDegree = 40;
    this.isDetailedViewActive = false;
    const degreeInRad = THREE.MathUtils.degToRad(rotationDegree);
    const pos = this.controls._target;

    this.enableCameraMovement();
    this.resetCameraControlsRotationLimits();
    this.setCameraControlsSpeed({
      restThreshold: 3,
      dampingFactor: 0.025
    });

    await Promise.all([
      this.controls.setLookAt(pos.x, pos.y, pos.z, 0, 0, 0, true),
      this.controls.rotateAzimuthTo(
        degreeInRad,
        true
      ),
      this.controls.rotatePolarTo(
        degreeInRad,
        true
      ),
      this.controls.dolly(-45, true),
    ]);

    await Promise.all([
      this.controls.dolly(-55, true),
      this.controls.truck(0, 18, true),
    ]);

    this.setCameraControlsSpeed({});
    this.updateControls();
  }

  addObjects() {
    const count = 8500;
    const duration = 0.9;
    const speed = 1.9;

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

  addPointsForCamera() {
    const geometry = new THREE.BoxGeometry(3, 3, 3);
    this.meshes = [];
    this.points = [
      { x: 0, y: 0, z: 0 },
      { x: -40.31063211935775, y: 0, z: -7.5299241136265564 },
      { x: -0.431651851596488, y: 0, z: 36.735493437942885 },
      { x: 38.360254480861435, y: 0, z: -4.134071872299652 },
      { x: 4.151668326034631, y: 0, z: -44.44804748500181 },
      { x: -29.568267868006334, y: 0, z: 26.032432790631393 },
      { x: 29.317626022399224, y: 0, z: -36.55709687455183 }
    ]

    for (let i = 0; i < 7; i++) {
      const material = new THREE.MeshBasicMaterial({ color: Math.random() * 0xebe1e1, transparent: false });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.position.x = this.points[i].x;
      mesh.position.y = this.points[i].y;
      mesh.position.z = this.points[i].z;

      mesh.callback = () => {
        this.cameraAnimation(mesh.position)
      };

      if (i == 0) {
        mesh.callback = () => {
          this.camerResetaAnimation();
        }
      }

      this.meshes.push(mesh);
      this.scene.add(mesh);
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
    if (isCameraMoving)
      return;

    this.updateCameraControlsRotationLimits();
    this.moveCameraOnPointerMove();
  }

  render() {
    this.renderManager();
    this.composer.render();

    requestAnimationFrame(this.render.bind(this));
  }
}

const sketch = new Sketch({
  dom: document.getElementById("container"),
});

sketch.fixHeightProblem();
