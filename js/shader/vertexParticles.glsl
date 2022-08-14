precision highp float;

uniform float time;
uniform bool boomAnimation;
uniform float twist;
uniform bool twist2;
uniform float animationTime;
uniform float transitionTime;
uniform float deltaY;
uniform float boomAnimationSpeed;
// uniform float animationTime=1.8;
// uniform float boomAnimationSpeed=1.3;
varying vec3 vPosition;
varying vec2 vUv;
attribute vec3 pos;

const vec3 color1=vec3(0.,.14,.64);
const vec3 color2=vec3(.39,.52,.97);
const vec3 color3=vec3(.51,.17,.75);
const float E=2.7182818284590452;
const float PI=3.14159265359;

//
// GLSL textureless classic 3D noise "cnoise",
// with an RSL-style periodic variant "pnoise".
// Author:  Stefan Gustavson (stefan.gustavson@liu.se)
// Version: 2011-10-11
//
// Many thanks to Ian McEwan of Ashima Arts for the
// ideas for permutation and gradient selection.
//
// Copyright (c) 2011 Stefan Gustavson. All rights reserved.
// Distributed under the MIT license. See LICENSE file.
// https://github.com/stegu/webgl-noise
//

vec3 mod289(vec3 x)
{
	return x-floor(x*(1./289.))*289.;
}

vec4 mod289(vec4 x)
{
	return x-floor(x*(1./289.))*289.;
}

vec4 permute(vec4 x)
{
	return mod289(((x*34.)+10.)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
	return 1.79284291400159-.85373472095314*r;
}

vec3 fade(vec3 t){
	return t*t*t*(t*(t*6.-15.)+10.);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
	vec3 Pi0=floor(P);// Integer part for indexing
	vec3 Pi1=Pi0+vec3(1.);// Integer part + 1
	Pi0=mod289(Pi0);
	Pi1=mod289(Pi1);
	vec3 Pf0=fract(P);// Fractional part for interpolation
	vec3 Pf1=Pf0-vec3(1.);// Fractional part - 1.0
	vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
	vec4 iy=vec4(Pi0.yy,Pi1.yy);
	vec4 iz0=Pi0.zzzz;
	vec4 iz1=Pi1.zzzz;
	
	vec4 ixy=permute(permute(ix)+iy);
	vec4 ixy0=permute(ixy+iz0);
	vec4 ixy1=permute(ixy+iz1);
	
	vec4 gx0=ixy0*(1./7.);
	vec4 gy0=fract(floor(gx0)*(1./7.))-.5;
	gx0=fract(gx0);
	vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0);
	vec4 sz0=step(gz0,vec4(0.));
	gx0-=sz0*(step(0.,gx0)-.5);
	gy0-=sz0*(step(0.,gy0)-.5);
	
	vec4 gx1=ixy1*(1./7.);
	vec4 gy1=fract(floor(gx1)*(1./7.))-.5;
	gx1=fract(gx1);
	vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1);
	vec4 sz1=step(gz1,vec4(0.));
	gx1-=sz1*(step(0.,gx1)-.5);
	gy1-=sz1*(step(0.,gy1)-.5);
	
	vec3 g000=vec3(gx0.x,gy0.x,gz0.x);
	vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
	vec3 g010=vec3(gx0.z,gy0.z,gz0.z);
	vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
	vec3 g001=vec3(gx1.x,gy1.x,gz1.x);
	vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
	vec3 g011=vec3(gx1.z,gy1.z,gz1.z);
	vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
	
	vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
	g000*=norm0.x;
	g010*=norm0.y;
	g100*=norm0.z;
	g110*=norm0.w;
	vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
	g001*=norm1.x;
	g011*=norm1.y;
	g101*=norm1.z;
	g111*=norm1.w;
	
	float n000=dot(g000,Pf0);
	float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
	float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
	float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
	float n001=dot(g001,vec3(Pf0.xy,Pf1.z));
	float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
	float n011=dot(g011,vec3(Pf0.x,Pf1.yz));
	float n111=dot(g111,Pf1);
	
	vec3 fade_xyz=fade(Pf0);
	vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
	vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
	float n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);
	return 2.2*n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P,vec3 rep)
{
	vec3 Pi0=mod(floor(P),rep);// Integer part, modulo period
	vec3 Pi1=mod(Pi0+vec3(1.),rep);// Integer part + 1, mod period
	Pi0=mod289(Pi0);
	Pi1=mod289(Pi1);
	vec3 Pf0=fract(P);// Fractional part for interpolation
	vec3 Pf1=Pf0-vec3(1.);// Fractional part - 1.0
	vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);
	vec4 iy=vec4(Pi0.yy,Pi1.yy);
	vec4 iz0=Pi0.zzzz;
	vec4 iz1=Pi1.zzzz;
	
	vec4 ixy=permute(permute(ix)+iy);
	vec4 ixy0=permute(ixy+iz0);
	vec4 ixy1=permute(ixy+iz1);
	
	vec4 gx0=ixy0*(1./7.);
	vec4 gy0=fract(floor(gx0)*(1./7.))-.5;
	gx0=fract(gx0);
	vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0);
	vec4 sz0=step(gz0,vec4(0.));
	gx0-=sz0*(step(0.,gx0)-.5);
	gy0-=sz0*(step(0.,gy0)-.5);
	
	vec4 gx1=ixy1*(1./7.);
	vec4 gy1=fract(floor(gx1)*(1./7.))-.5;
	gx1=fract(gx1);
	vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1);
	vec4 sz1=step(gz1,vec4(0.));
	gx1-=sz1*(step(0.,gx1)-.5);
	gy1-=sz1*(step(0.,gy1)-.5);
	
	vec3 g000=vec3(gx0.x,gy0.x,gz0.x);
	vec3 g100=vec3(gx0.y,gy0.y,gz0.y);
	vec3 g010=vec3(gx0.z,gy0.z,gz0.z);
	vec3 g110=vec3(gx0.w,gy0.w,gz0.w);
	vec3 g001=vec3(gx1.x,gy1.x,gz1.x);
	vec3 g101=vec3(gx1.y,gy1.y,gz1.y);
	vec3 g011=vec3(gx1.z,gy1.z,gz1.z);
	vec3 g111=vec3(gx1.w,gy1.w,gz1.w);
	
	vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
	g000*=norm0.x;
	g010*=norm0.y;
	g100*=norm0.z;
	g110*=norm0.w;
	vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
	g001*=norm1.x;
	g011*=norm1.y;
	g101*=norm1.z;
	g111*=norm1.w;
	
	float n000=dot(g000,Pf0);
	float n100=dot(g100,vec3(Pf1.x,Pf0.yz));
	float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));
	float n110=dot(g110,vec3(Pf1.xy,Pf0.z));
	float n001=dot(g001,vec3(Pf0.xy,Pf1.z));
	float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));
	float n011=dot(g011,vec3(Pf0.x,Pf1.yz));
	float n111=dot(g111,Pf1);
	
	vec3 fade_xyz=fade(Pf0);
	vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
	vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);
	float n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);
	return 2.2*n_xyz;
}

float rand(vec2 co){
	return fract(sin(dot(co,vec2(12.9898,78.233)))*43758.5453);
}

float range(float x,float limit){
	if(x>0.){
		return limit;
	}
	else{
		return-limit;
	}
}

float normalDistribution(float x){
	const float u=.34;
	const float sigma=.1;
	
	return(1./(sigma*pow(2.*PI,.5)))*pow(E,-pow((x-u),2.)/(2.*pow(sigma,2.)));
}

mat3 rotation3dY(float angle){
	float s=sin(angle);
	float c=cos(angle);
	
	float scaler=pow(E*E*1.,smoothstep(0.,animationTime,time)*boomAnimationSpeed);
	// float scaler=1.;
	
	return mat3(
		c*scaler,0.,-s*scaler,
		0.,1.,0.,
		s*scaler,0.,c*scaler
	);
}

vec3 fbm_vec3(vec3 p,float frequency,float offset){
	return vec3(
		cnoise((p+vec3(offset))*frequency),
		cnoise((p+vec3(offset+20.))*frequency),
		cnoise((p+vec3(offset-30.))*frequency)
	);
}

vec3 getOffset(vec3 p){
	float twistScale=cnoise(pos)*.5+5.;
	// vec3 tempPos=rotation3dY(time*(.1+twistScale)+length(pos.xz))*p;
	
	vec3 offset=fbm_vec3(pos,3.,.5);
	
	float lastTime=transitionTime-.3;
	float delta=smoothstep(0.,transitionTime-lastTime,time-lastTime);
	
	if(twist2){
		if(twist>0.){
			float lastTime=transitionTime-.3;
			float delta=smoothstep(0.,transitionTime-lastTime,time-lastTime);
			return offset*delta*twistScale;
		}
		else if(twist<0.){
			float lastTime=transitionTime-.3;
			float delta=smoothstep(transitionTime-lastTime,0.,time-lastTime);
			return offset*delta*twistScale;
		}
	}
	else{
		return offset;
	}
}

void main(){
	
	vUv=position.xy+vec2(.5);
	vec3 finalPos=pos+position*.1;
	
	float particleSize=cnoise(pos*5.)*.5+2.5;
	
	vec3 worldPos=rotation3dY((time)*.01*(.1+particleSize*.5))*pos;
	
	vec3 offset0=getOffset(worldPos);
	vec3 offset=fbm_vec3(worldPos+offset0,.3,.0);
	
	worldPos+=offset;
	worldPos+=offset0;
	
	vec3 particlePosition=(modelMatrix*vec4(worldPos,1.)).xyz;
	
	vec4 viewPos=viewMatrix*vec4(particlePosition,1.);
	
	viewPos.xyz+=position*(.02+.05*particleSize);
	if(twist2&&twist>0.){
		float lastTime=transitionTime-.3;
		float delta=smoothstep(0.,transitionTime-lastTime,time-lastTime);
		viewPos.y+=-delta*deltaY;
	}
	else if(twist2&&twist<0.){
		float lastTime=transitionTime-.3;
		float delta=smoothstep(transitionTime-lastTime,0.,time-lastTime);
		viewPos.y+=-delta*deltaY;
	}
	
	gl_Position=projectionMatrix*viewPos;
	
}