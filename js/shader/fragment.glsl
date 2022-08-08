precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform vec2 u_resolution;

void main(){
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
	
	// vec2 st=gl_FragCoord.xy/u_resolution.xy;
	
	// vec3 color1=vec3(0.7647, 0.4941, 0.0588);
	// vec3 color2=vec3(0.0, 0.6157, 0.1843);
	
	// float mixValue=distance(st,vec2(0,1));
	
	// vec3 color=mix(color1,color2,mixValue);
	// vec4 ttt=texture2D(uTexture,vUv);
	
	// gl_FragColor=vec4(color,ttt.r);

	vec2 pos_ndc = 2.0 * gl_FragCoord.xy / u_resolution.xy - 1.0;
    float dist = length(pos_ndc);

    vec4 white = vec4(0.1373, 0.0902, 0.7725, 1.0);
    vec4 red = vec4(0.1137, 0.4118, 0.1647, 1.0);
    vec4 blue = vec4(1.0, 0.9686, 0.0, 1.0);
    vec4 green = vec4(0.0, 1.0, 0.0, 1.0);
    float step1 = 0.0;
    float step2 = 0.5;
    float step3 = 0.78;
    float step4 = 1.0;

    vec4 color = mix(white, red, smoothstep(step1, step2, dist));
    color = mix(color, blue, smoothstep(step2, step3, dist));
    color = mix(color, green, smoothstep(step3, step4, dist));

	vec4 ttt=texture2D(uTexture,vUv);
	gl_FragColor=vec4(vec3(color),ttt.r);
	// gl_FragColor=vec4(vec3(1.0),ttt.r);
    // gl_FragColor = color;
}