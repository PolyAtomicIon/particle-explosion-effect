import * as THREE from "three";
// import particleTexture from "../particle-texture.png";
import particleTexture from "../star.png";

export default class StarFall {
  constructor(resolution) {
    this.count = 3000;
    this.baseColors = [
      new THREE.Color("rgb(161, 235, 91)"),
      new THREE.Color("rgb(29, 105, 42)"),
      new THREE.Color("rgb(255, 247, 0)"),
    ]
    this.geo = [];
    this.geometry = null;
    this.stars = null;
    this.acceleration = 0.04;
    this.resolution = resolution;

    this.isPlaying = false;
  }

  loadAssets() {
    return new Promise((resolve) => {
      this.sprite = new THREE.TextureLoader().load(particleTexture, () => resolve());
    });
  }

  createMaterial() {
    this.material = new THREE.PointsMaterial({
      size: .6,
      vertexColors: true,
      map: this.sprite,
      // blending: THREE.AdditiveBlending,
      // depthWrite: false,
      // transparent: true,
      // depthTest: false,
    })
  }

  createStarFall() {
    this.geometry = this.createGeometry();
    this.stars = new THREE.Points(this.geometry, this.material);
    this.stars.frustumCulled = false;
    // this.stars.layers.set(1);
    return this.stars;
  }

  createGeometry() {
    const geometry = new THREE.BufferGeometry();

    const vertices = [];
    const vertex = new THREE.Vector3();

    const colors = [];
    let color = new THREE.Color();

    const n = 200;
    const n2 = n / 2;

    for (let i = 0; i < this.count; i++) {

      vertex.x = Math.random() * n - n2;
      vertex.y = Math.random() * n - n2;
      vertex.z = Math.random() * n - n2;

      vertices.push(vertex.x, vertex.y, vertex.z);
      const v = new THREE.Vector3(
        vertex.x,
        vertex.y,
        vertex.z,
      );
      v.velocity = 0;

      this.geo.push(v);

      // colors
      color = this.baseColors[Math.floor(Math.random() * 3)];
      colors.push( color.r, color.g, color.b );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    return geometry;
  }

  stop() {
    this.isPlaying = false;
    this.acceleration = 0;
    this.stars.removeFromParent();
    this.geometry.dispose();
    this.material.dispose();
  }

  play() {
    this.isPlaying = true;
  }

  render(time) {
    if (this.stars && this.isPlaying) {
      const vertices = [];

      for (let i = 0; i < this.geo.length; i += 2) {
        const p1 = this.geo[i];

        p1.velocity += this.acceleration;
        p1.y += p1.velocity;
        p1.z += p1.velocity;

        // console.log(p1.y)
        if (p1.y > 250 || p1.z > 125) {
          p1.y = Math.random() * 200 - 100;
          p1.z = Math.random() * 200 - 100;
          p1.velocity = 0;
        }

        vertices.push(p1.x, p1.y, p1.z);
      }
      // console.log(this.stars)
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      this.geometry.attributes.position.verticesNeedUpdate = true;
    }

  }

}