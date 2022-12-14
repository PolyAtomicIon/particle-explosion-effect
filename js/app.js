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

    this.materials = [];

    this.settings();

    this.particleCloud = new ParticleCloud();
    this.addObjects();
    this.addPointsForCamera();

    this.setPostProcessing();
    this.resize();
    this.render();
    this.setupResize();
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

  cameraAnimation(position = { x: 0, y: 0, z: 0 }) {
    if (!this.particleCloud.isMorphingEnabled) {
      this.settings.morph = true;
      this.gui.morph = true;
      this.morph();
    }
    
      this.controls.moveTo(position.x, position.y, position.z, true);
      this.controls.setLookAt(position.x, position.y, position.z, 0, 0, 0, true);

      const degreeInRad = THREE.MathUtils.degToRad(90);
      // this.controls.minPolarAngle = degreeInRad;
      // this.controls.maxPolarAngle = degreeInRad;
      this.controls.rotatePolarTo(
        degreeInRad,
        true
      );
      this.controls.dollyTo(80, true)
    // }
    // else {
    //   this.settings.morph = false;
    //   this.gui.morph = false;
    //   this.morph();
    //   this.controls.moveTo(
    //     0,
    //     0,
    //     0,
    //     true
    //   );

    //   const degreeInRad = THREE.MathUtils.degToRad(25);
    //   // this.controls.minPolarAngle = degreeInRad;
    //   // this.controls.maxPolarAngle = degreeInRad;
    //   this.controls.rotatePolarTo(
    //     degreeInRad,
    //     true
    //   );
    //   this.controls.dollyTo(150, true)
    // }
    this.updateControls();
  }

  settings() {
    this.settings = {
      morph: false,
      exposure: 1,
      bloomStrength: 1.1,
      bloomThreshold: 0,
      bloomRadius: 0
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "morph").onChange(() => this.morph());
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

  resize() {
    this.particleCloud.resize({
      x: this.width,
      y: this.height
    });
  }

  morph() {
    if (!this.particleCloud.isMorphingEnabled) {
      // this.changeExposure(0.45);
      this.changeExposure(0.7);
      this.changeBloomStrength(0.5);
    }
    else {
      this.changeExposure(1);
      this.changeBloomStrength(1.1);
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

  addObjects() {
    const count = 4000;
    const duration = 0.9;
    const speed = 1.8;

    this.particleCloud.createShaderMaterial(
      { x: this.width, y: this.height },
      duration,
      speed,
      0
    );

    let minRadius = 0.01;
    let maxRadius = 0.5;
    const minGapRadius = 0.05;
    const maxGapRadius = 0.3;

    for (let i = 0; i < 4; i++) {

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

  addPointsForCamera() {
    const geometry = new THREE.BoxGeometry(10, 10, 10);
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

      this.scene.add(mesh);
      // const control = new TransformControls(this.camera, this.renderer.domElement);
      // control.attach(mesh);
      // this.scene.add(control);

      // control.addEventListener('dragging-changed', () => {
      //   console.log(mesh.position);
      // });
    }

  }

  render() {
    this.renderManager();
    this.composer.render();
    this.particleCloud.render(this.time);
    requestAnimationFrame(this.render.bind(this));
  }
}

const sketch = new Sketch({
  dom: document.getElementById("container"),
});

sketch.fixHeightProblem();
