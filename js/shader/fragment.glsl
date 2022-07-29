precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;

void main () {
	// if(globalAlpha < .001 || opacity < .001 || vScale < .001 || fogDepth < .001) discard;
	// vec2 st = vec2(-1.0) + 2.0 * gl_PointCoord.xy;
	// float d = 1.0 - distance(st, vec2(0.));

	// // d = mix(d, smoothstep(0., .25, d), depth);
	// if(!glow) d = smoothstep(0., .25, d);
	// else d = mix(d, smoothstep(0., .25, d), depth);
	// float depthOpacity = mix(.25, 1.0, depth);
	
	// if(d < .001) discard;

	// float op = d * opacity * globalAlpha * depthOpacity;
	// // op = mix(op, smoothstep(.0, .4, op), fdAlpha);

	// vec3 finalColor = mix(vColor, mix(vColor, vec3(1.), .35), vRing);
	// finalColor = mix(finalColor, vec3(0.), 1.0-fogDepth);

	// finalColor = mix(finalColor, applyLevels(finalColor), vLevels);

	// gl_FragColor = vec4(finalColor, op * fogDepth*superOpacity);
	vec4 ttt = texture2D(uTexture, vUv);
	gl_FragColor = vec4(vec3(0.1412, 0.5922, 0.1922), ttt.r);
}