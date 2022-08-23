import * as THREE from "three";

export default class StarFall {
  constructor() {
    this.count = 3500;
    this.geo = [];
    this.geometry = null;
    this.stars = null;
    this.acceleration = 0.02;
    this.material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      opacity: 1,
      linewidth: 2
    });
    this.isPlaying = false;
  }

  createStarFall() {
    this.geometry = this.createGeometry();
    this.stars = new THREE.LineSegments(this.geometry, this.material);
    this.stars.frustumCulled = false;
    this.stars.layers.set(1);
    return this.stars;
  }

  createGeometry() {
    const geometry = new THREE.BufferGeometry();
    const vertex = new THREE.Vector3();
    const vertices = [];

    for (let i = 0; i < this.count; i++) {

      vertex.x = Math.random() * 150 - 75;
      vertex.y = Math.random() * 200 - 100;
      vertex.z = Math.random() * 150 - 75;

      // vertex.multiplyScalar(4)
      vertices.push(vertex.x, vertex.y, vertex.z);
      const v = new THREE.Vector3(
        vertex.x,
        vertex.y,
        vertex.z,
      );
      v.velocity = 0;
      this.geo.push(v);

      // vertex.multiplyScalar(1.2)
      vertices.push(vertex.x, vertex.y, vertex.z);
      const f = new THREE.Vector3(
        vertex.x,
        vertex.y,
        vertex.z,
      );
      f.velocity = 0;
      this.geo.push(f);

    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    return geometry;
  }

  stop() {
    this.isPlaying = false;
    this.acceleration = 0;
  }

  play() {
    this.isPlaying = true;
  }

  render(time) {
    if (this.stars && this.isPlaying) {
      const vertices = [];

      for (let i = 0; i < this.geo.length; i += 2) {
        const p1 = this.geo[i];
        const p2 = this.geo[i + 1];
        p1.velocity += this.acceleration;
        p1.y += p1.velocity;
        p1.z += p1.velocity;
        if (time > 0.01) {
          p2.velocity += this.acceleration - 0.0001;
        }
        else {
          p2.velocity += this.acceleration - 0.005;
        }
        p2.y += p2.velocity;
        p2.z += p2.velocity;

        // console.log(p1.y)
        if (p1.y > 100 || p1.z > 75) {
          const y = Math.random() * 100 - 50;
          const z = Math.random() * 50 - 25;

          p1.y = y;
          p1.z = z;
          p1.velocity = 0;

          p2.y = y;
          p2.z = z;
          p2.velocity = 0;
        }

        vertices.push(p1.x, p1.y, p1.z);
        vertices.push(p2.x, p2.y, p2.z);
      }
      // console.log(this.stars)
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      this.geometry.attributes.position.verticesNeedUpdate = true;
    }

  }

}