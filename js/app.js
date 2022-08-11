import * as THREE from "three";
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


    this.setPostProcessing();
    
    this.resize();
    this.render();
    this.setupResize();
    this.raycasterEvent();
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

  raycasterEvent() {
    this.event.on("tap", ({ position, event, }) => {
      // console.log(position, event)

      // const { clientX, clientY } = position;
      // this.settings.morph = true;
      this.morph();

      // this.controls.rotatePolarTo(
      //   95 * THREE.MathUtils.DEG2RAD,
      //   true
      // );
      // this.controls.dollyTo(12, true);
    })
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
    this.gui.add(this.settings, 'exposure', 0.1, 2).onChange( (value) => {
      this.changeExposure(value);
    });
    this.gui.add(this.settings, 'bloomThreshold', 0.0, 1.0).onChange( (value) => {
      this.bloomPass.threshold = Number(value);
    });
    this.gui.add(this.settings, 'bloomStrength', 0.0, 3.0).onChange( (value) => {
      this.changeBloomStrength(value);
    });
    this.gui.add(this.settings, 'bloomRadius', 0.0, 1.0).step(0.01).onChange( (value) => {
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
    // if( !this.particleCloud.isMorphingEnabled ){
    //   this.changeExposure(0.2);
    //   this.changeBloomStrength(0.5);
    // }
    // else{
    //   this.changeExposure(1);
    //   this.changeBloomStrength(1.1);
    // }
    this.particleCloud.morph(this.time);
  }

  changeExposure(value) {
    this.renderer.toneMappingExposure = Math.pow(value, 4.0);
  }

  changeBloomStrength(value) {
    this.bloomPass.strength = Number(value);
  }

  addObjects() {
    const count = 8000;
    const duration = 0.9;
    const speed = 1.8;

    this.particleCloud.createShaderMaterial(
      { x: this.width, y: this.height },
      duration,
      speed,
      4
    );
    
    let minRadius = 0.01;
    let maxRadius = 0.1;
    for (let i = 0; i < 1; i++) {
      const mesh = this.particleCloud.createParticleCloud(
        count,
        minRadius,
        maxRadius,
      );

      this.scene.add(mesh);
      minRadius += 0.01;
      maxRadius += 0.2;
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
