precision highp float;
varying vec2 vUv;
uniform float size;

void main(){
  vUv=uv;
  vec4 mvPosition=modelViewMatrix*vec4(position,1.);
  
  gl_PointSize=size;
  gl_PointSize*=(size/-mvPosition.z);
  
  gl_Position=projectionMatrix*mvPosition;
}