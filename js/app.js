import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertexParticles.glsl";
import GUI from "lil-gui";
import gsap from "gsap";
import scene from "../scene.json";
import colorTiles from "../color-tiles.png";
import particleTexture from "../particle-texture.png";
const random = require("canvas-sketch-util/random");
const createInputEvents = require("simple-input-events");

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      transparent: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setClearColor(0x000000, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.event = createInputEvents(this.renderer.domElement);
    this.renderer.autoClear = false;

    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.001,
      10000
    );

    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 4, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isBoomAnimationActive = true;
    // setTimeout(() => {
    //   console.log('dsfsdfsd');
    //   this.isBoomAnimationActive = false;
    // }, 1000);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.glow = new THREE.WebGLRenderTarget(this.width, this.height, {});

    this.isPlaying = true;

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
    this.raycasterEvent();

    this.clock = new THREE.Clock();
  }

  raycasterEvent() {
    this.ball = new THREE.Mesh(
      new THREE.SphereBufferGeometry(10, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x000000 })
    );
    this.scene.add(this.ball);

    let testmesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1000, 1000),
      new THREE.MeshBasicMaterial({ transparent: true })
    );
    testmesh.rotation.x = -Math.PI / 2;
    testmesh.visible = false;
    this.scene.add(testmesh);

    this.event.on("move", ({ position, event, inside, dragging }) => {
      // mousemove / touchmove
      // console.log(position); // [ x, y ]
      // console.log(event); // original mouse/touch event
      // console.log(inside); // true if the mouse/touch is inside the element
      // console.log(dragging); // true if the pointer was down/dragging

      this.pointer.x = (position[0] / window.innerWidth) * 2 - 1;
      this.pointer.y = -(position[1] / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);

      const intersects = this.raycaster.intersectObjects([testmesh]);

      // console.log(intersects[0]);
      if (intersects[0]) {
        let p = intersects[0].point;
        this.ball.position.copy(p);
      }
    });
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0,
      glow: false,
      fdAlpha: 0,
      superScale: 1,
    };
    this.gui = new GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
    this.gui.add(this.settings, "fdAlpha", 0, 1, 0.01);
    this.gui.add(this.settings, "superScale", 0, 3, 0.01);
    this.gui.add(this.settings, "glow");
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
  }

  addObjects() {

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        uTexture: {value: new THREE.TextureLoader().load(particleTexture)}, 
        time: { value: 0 },
        boomAnimation: { value: this.isBoomAnimationActive },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
      blending: THREE.AdditiveBlending,
      // depthWrite: false,
      depthTest: false,
    });


    let count = 80000;
    let minRadius = 0.02;
    let maxRadius = 0.04;
    let pos = new Float32Array(count * 3);

    let particlegeo = new THREE.PlaneBufferGeometry(1, 1);
    let geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = count;
    geo.setAttribute("position", particlegeo.getAttribute('position'));
    geo.index = particlegeo.index;

    for (let i = 0; i < count; i++) {
      let theta = Math.random() * 2 * Math.PI;
      let r = lerp(minRadius, maxRadius, Math.random());
      let x = r * Math.sin(theta);
      let y = (Math.random() - 0.5) * 0.05;
      let z = r * Math.cos(theta);

      pos.set([
        x, y, z
      ], i * 3);
    }

    geo.setAttribute("pos", new THREE.InstancedBufferAttribute(pos, 3, false));
    geo.setAttribute("uv", new THREE.BufferAttribute(pos, 2));
    this.mesh = new THREE.Mesh(geo, this.material);
    this.scene.add(this.mesh);

    console.log(this.mesh);

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

  render() {
    if (!this.isPlaying) return;
    this.time += 0.01;

    this.renderer.clear();
    // this.renderer.setClearColor(0x000000, 1);
    // this.material.uniforms.glow.value = 1;
    // this.material.uniforms.superOpacity.value = this.settings.fdAlpha;
    // this.material.uniforms.superScale.value = this.settings.superScale;
    // this.renderer.setRenderTarget(this.glow);
    // this.renderer.setRenderTarget(null);

    // this.renderer.autoClear = false;
    this.renderer.clearDepth();
    // this.material.uniforms.glow.value = 0;
    // this.renderer.setClearColor(0x000000, 0);

    // this.time = this.time%1;
    // this.material.uniforms.fade.value = this.settings.progress;
    // this.material.uniforms.glow.value = this.settings.glow
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.boomAnimation.value = this.isBoomAnimationActive;
    // this.material.uniforms.fdAlpha.value = this.settings.fdAlpha;
    // this.material.uniforms.superOpacity.value = 1;
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

  }
}

new Sketch({
  dom: document.getElementById("container"),
});
