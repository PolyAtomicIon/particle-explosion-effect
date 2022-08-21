import * as THREE from "three";
import { lerp } from './utils'
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertexParticles.glsl";
import simpleVertex from "./shader/vertex.glsl";
import particleTexture from "../particle-texture.png";
import colorTexture from "../color-tiles.png";

export default class ParticleCloud {
  constructor() {
    this.transitionTime = 0;
    this.isMorphingEnabled = false;

    this.material = null;
    this.particleTexture = new THREE.TextureLoader().load(particleTexture);
    this.colorTexture = new THREE.TextureLoader().load(colorTexture);
  }

  morph(time) {
    this.transitionTime = time + 0.3;
    this.isMorphingEnabled = !this.isMorphingEnabled;
  }

  resize(resolution) {
    if (this.material)
      this.material.uniforms.u_resolution.value = resolution;
  }

  createShaderMaterial(
    resolution,
    animationTime,
    animationSpeed,
    deltaY,
  ) {
    const uniforms = {
      uTexture: { value: this.particleTexture },
      aTexture: { value: this.colorTexture },
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      u_resolution: { value: resolution },
      animationTime: { value: animationTime },
      transitionTime: { value: 0 },
      animationSpeed: { value: animationSpeed },
      twist: { value: 0. },
      deltaY: { value: deltaY },
    };

    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: uniforms,
      // wireframe: true,
      transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });

    this.material.toneMapped = false;
  }

  createParticleCloud(
    count,
    minRadius,
    maxRadius,
  ) {

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

    const mesh = new THREE.Mesh(geo, this.material);
    mesh.frustumCulled = false;
    mesh.position.y += 20;

    return mesh;
  }

  createBillboardMaterial(resolution) {

    const uniforms = {
      uTexture: { value: this.particleTexture },
      aTexture: { value: this.colorTexture },
      time: { value: 0 },
      resolution: { value: new THREE.Vector4() },
      u_resolution: { value: resolution },
      animationTime: { value: 0.9 },
      animationSpeed: { value: 2.25 },
    };

    this.billboardMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: uniforms,
      // wireframe: true,
      transparent: true,
      vertexShader: simpleVertex,
      fragmentShader: fragment,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    this.billboardMaterial.toneMapped = false;
  }

  createBillboard() {
    const count = 4000;

    let pos = new Float32Array(count * 3);
    let particlegeo = new THREE.PlaneBufferGeometry(1, 1);
    let geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = count;
    geo.setAttribute("position", particlegeo.getAttribute('position'));
    geo.index = particlegeo.index;

    for (let i = 0; i < count; i++) {
      const x = 1 * Math.random() - .5;
      const y = 0.5 * Math.random() - .25;
      const z = 1 * Math.random() - .5;

      pos.set([
        x, y, z
      ], i * 3);
    }

    geo.setAttribute("pos", new THREE.InstancedBufferAttribute(pos, 3, false));
    geo.setAttribute("uv", new THREE.BufferAttribute(pos, 2));

    const mesh = new THREE.Mesh(geo, this.billboardMaterial);
    mesh.frustumCulled = false;
    mesh.position.y += 20;
    mesh.layers.set(1);

    return mesh;
  }

  render(time) {
    if (this.billboardMaterial) {
      this.billboardMaterial.uniforms.time.value = time;
    }

    if (this.material) {
      this.material.uniforms.time.value = time;
      this.material.uniforms.transitionTime.value = this.transitionTime;
      if (this.isMorphingEnabled) {
        this.material.uniforms.twist.value = 1;
      }
      else {
        this.material.uniforms.twist.value = -1;
      }
    }
  }
}