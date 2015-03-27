XML3D.shaders.register("raycaster", {
    vertex : [
        "attribute vec3 position;",

        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelMatrix;",

		"varying vec3 vEntryPoint;",
        "varying vec4 vPosition;",
		
		"varying vec3 vMoveDelta;",
		
		"uniform vec3 octreeNodePosition; ",
		
        "void main(void)",
        "{",
        "    vPosition = modelViewProjectionMatrix * vec4(position, 1.0);",
		
        "    vec4 p = vec4( position, 1.0 );",
        "    p = modelMatrix * p;",
        "    p.xyz /= p.w;",
        "    vEntryPoint = p.xyz;",

        "    vec4 tmpMoveDelta = vec4( 0.0, 0.0, 0.0, 1.0 );",
        "    tmpMoveDelta = modelMatrix * tmpMoveDelta;",
        "    vMoveDelta = tmpMoveDelta.xyz + octreeNodePosition;",
		
        "    gl_Position = vPosition;",
        "}" 

    ].join("\n"),

    fragment : [
        "const float NUMBER_OF_STEPS = 256.0;",

        "uniform sampler2D volumeData;",
        "uniform sampler2D backface;",
        "uniform sampler2D transferFunction;",
        "uniform sampler2D noiseFunction;",

		"uniform vec3  size;",  	   // real size of the volume bounding box
		"uniform float stepSize;",
		"uniform int   randomizeStartPosition;",
        "uniform float baseIntensity;",
        "uniform float rayTerminationAccuracy;",
        "uniform int   renderType;",   // 0 - default semi-transparent, 1 - MIP
        
		"uniform float gridSizeZ;",  
		"uniform vec2  gridStep;",
		"uniform vec3  outerGridSize;",
		
		"uniform vec3 overlapClose;",
		"uniform vec3 overlapFar;",
		
		"uniform bool  octreeIsSplit;",
		"uniform float octreeLevel;",
		"uniform vec3  octreeNodeRelativePosition; ",
		
		"uniform vec2  mosaicFactor;",
		"uniform vec2  viewPortSize;",
		
        "varying vec3 vEntryPoint;",
        "varying vec4 vPosition;",
		"varying vec3 vMoveDelta;",

        "float textureLookupAtSlice( float sliceNumber, vec2 localCoordInSlice )",
        "{",
        "    vec2 offset;",
		"	 sliceNumber = mod( sliceNumber, (mosaicFactor.x*mosaicFactor.y) ); ",
		
        "    offset.x = fract( sliceNumber / mosaicFactor.x );",
        "    offset.y = -floor( sliceNumber / mosaicFactor.x ) / mosaicFactor.y;",
	
		"    return texture2D( volumeData, ( localCoordInSlice + offset ) ).r;",
        "}",
		
        "float sampler3DValue( vec3 coord, vec3 octreeNodeNormPos, vec3 sizeCutCoef, vec2 clampMin, vec2 clampMax )",
        "{",
		"    float result;",
        "    vec3 localCoordinate = coord / size;",
        "    localCoordinate.y = 1.0 - localCoordinate.y;",
		"	 localCoordinate /= octreeLevel;",
		"    localCoordinate.xy /= mosaicFactor;",
		
		//   cut off voxel overlaps that are there only to provide continuous interpolation near the brick borders
		"    localCoordinate *= sizeCutCoef;", 
		"    localCoordinate += overlapClose * vec3(gridStep.x, gridStep.y, 1.0);",

		"	 localCoordinate += octreeNodeNormPos;",
		
		//   cut off half-voxels near the slice borders to prevent effect of interpolation from neighbouring slices
		"	 localCoordinate.xy = clamp( localCoordinate.xy, clampMin, clampMax );",
		"	 localCoordinate.y = 1.0 - localCoordinate.y;",
		
		"	 localCoordinate.z = max(localCoordinate.z - 0.5, 0.0);", // (0.5*gridStep) - region of interpolation effect, gridStep.z is always = 1
		"    float sliceFirst = floor(localCoordinate.z);",
        "    sliceFirst = min(sliceFirst, outerGridSize.z - 1.0);",
		"    float sliceSecond = sliceFirst + 1.0;",

		"	 float closestValue = textureLookupAtSlice( sliceFirst, localCoordinate.xy );",

        "    if ( sliceSecond < outerGridSize.z )",
        "    {",
        "        float nextValue = textureLookupAtSlice( sliceSecond, localCoordinate.xy );",
        "        result = mix(closestValue, nextValue, fract(localCoordinate.z));",
        "    } else ",
        "        result = closestValue;",
		
		"    return result;",
        "}",

        "void main(void)",
        "{",
        "    vec4 src;",
        "    vec4 dst = vec4(0.0, 0.0, 0.0, 0.0);",
		
		"    vec3 vEntryPoint_ = vEntryPoint.xyz - vMoveDelta;",
		
        // setup ray by reading entry position from texture containing backface positions
        "    vec3 rayPos = vEntryPoint_.xyz;",
		
        "    vec2 homogeneousScreenSpaceCoordinates = gl_FragCoord.xy / viewPortSize;",

        "    float epsilon = texture2D( noiseFunction, fract( gl_FragCoord.xy / 64.0 )  ).r;",
		
        "    vec4 fetchedPosition = texture2D( backface, homogeneousScreenSpaceCoordinates );",

        // this handles the case that due to oversampling in the final render call the worldspace texture does
        // not contain a value at this very position
        "    if ( fetchedPosition.w == 0.0 )",
        "        return;",
		
        "    vec3 rayExitPos = fetchedPosition.xyz - vMoveDelta;",
		
        "    vec3 rayDir = rayExitPos - vEntryPoint_;",
		
		"    vec3 rayLength = abs( rayDir );",
		"    vec3 numSteps3D = ( rayLength * (1.0/stepSize) ) / size;",
		"    float maxNumSteps = max( max(numSteps3D.x, numSteps3D.y), numSteps3D.z );",
		"    vec3 step = rayDir / maxNumSteps;",
		"    float stepLen = length( step );", 
		
        "    float stopLength = distance( vEntryPoint_, rayExitPos );",
		"    float curLength = 0.0;",

        "    if  ( randomizeStartPosition != 0 ) {",
		"        vec3 randomStep = step * epsilon;",
        "        rayPos += randomStep;",
		"        curLength = length( randomStep );", 
		"    }",
		
		"	 float maxIntensity = 0.0;",
		
		"	 vec3 octreeNodeNormPos = vec3(0.0, 0.0, 0.0);",
		"	 if (octreeLevel > 1.0) { ",
		"		vec3 outerSize = size * octreeLevel;",   
		"	 	octreeNodeNormPos.xz = octreeNodeRelativePosition.xz / outerSize.xz;",
		" 		octreeNodeNormPos.y = 1.0 - (( size.y + octreeNodeRelativePosition.y ) / outerSize.y );",
		"	 }",
		
		//   for the case when data is bricked
		"    vec3 gridStep3D = vec3(gridStep.x, gridStep.y, 1.0);",
		"    vec3 sliceSize = gridStep3D * outerGridSize;",
		"    vec3 overlapSize = gridStep3D * ( overlapClose + overlapFar );",
		"    vec3 sizeCutCoef = ( sliceSize - overlapSize ) / sliceSize;",
		"    octreeNodeNormPos.z *= outerGridSize.z;",
		"    octreeNodeNormPos *= sizeCutCoef;",
		"	 octreeNodeNormPos.xy /= mosaicFactor;",
		"	 sizeCutCoef.z = outerGridSize.z - overlapSize.z;",
		
		"    vec2 clampMin = 0.5 * gridStep;",
		"    vec2 clampMax = sliceSize.xy - (0.5 * gridStep);",

        "    for ( float i = 0.0; i < NUMBER_OF_STEPS; i += 1.0 )",
        "    {",
		"        if ( (curLength > stopLength) || (dst.a > rayTerminationAccuracy) || (maxIntensity == 1.0) )",
        "            break;",

        "        float intensity = sampler3DValue( rayPos.xyz, octreeNodeNormPos, sizeCutCoef, clampMin, clampMax );",
		
        "		 if (renderType == 0) {", // not MIP
        "        	 src = texture2D( transferFunction, vec2( intensity , 0.0 ) );",

		"	         if (!octreeIsSplit) { ",
		"        	     if (src.a != 0.0) ",	// because XML3D sets gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL in true
		"        	 	    src.rgb /= src.a;", // here we need to cancel this multiplication (needs further discussion)
		
        "        	     src.a *= (stepSize * baseIntensity);",
		"        	     src.rgb *= src.a;",
        "            }",
		
		"        	 dst = dst + (1.0 - dst.a) * src;",
		"		 }",
        "		 else {",
        "	 		 if (maxIntensity < intensity) {",
        "				 maxIntensity = intensity;",
        "			 }		",
        "		 }			",

        "        rayPos += step;",
        "        curLength += stepLen;",
		
        "        vec3 tmp1 = sign( rayPos - vEntryPoint_.xyz );",
        "        vec3 tmp2 = sign( rayExitPos - rayPos );",
        "        float inside = dot( tmp1, tmp2 );",
        "        if ( inside < 3.0 )",
        "            break;",
        "    }",
		
        "	if (renderType == 1) {", // MIP
        "		dst = texture2D( transferFunction, vec2( maxIntensity , 0.0 ) );",
        "	}",
		
		"    gl_FragColor = dst;",
        "}"
    ].join("\n"),

    hasTransparency: function(params) {  // volumes are always semi-transparent
        return true;
    },

    uniforms : {     // default values for raycaster shader
		size 		 : [1.0, 1.0, 1.0],
		stepSize     : 0.02,
        randomizeStartPosition : 0,
		baseIntensity: 30.0,
        rayTerminationAccuracy : 0.975,
		renderType   : 0,
		
		mosaicFactor : [16.0, 16.0],
		viewPortSize : [0.0, 0.0],
		outerGridSize: [0.0, 0.0, 0.0],
		gridStep 	 : [0.0, 0.0],
		gridSizeZ    : 0.0,
		
		octreeIsSplit: false,
		octreeNodePosition: [0.0, 0.0, 0.0],
		octreeNodeRelativePosition: [0.0, 0.0, 0.0],
		octreeLevel  : 1.0,
		overlapClose : [0.0, 0.0, 0.0],
		overlapFar   : [0.0, 0.0, 0.0]
	},
	
	samplers: {
        transferFunction: 	null,
        noiseFunction 	: 	null,
		volumeData 		:	null,
		backface 		:	null
    }
});

XML3D.shaders.register("backface", {
    vertex : [
        "attribute vec3 position;",
		
        "uniform mat4 modelViewProjectionMatrix;",
        "uniform mat4 modelMatrix;",

        "varying vec3 vExitPoint;",

        "void main(void)",
        "{",
		"    vec4 pos = modelViewProjectionMatrix * vec4(position, 1.0);",

        "    vec4 p = vec4( position, 1.0 );",
        "    p = modelMatrix * p;",
        "    p.xyz /= p.w;",
        "    vExitPoint = p.xyz;",

        "    gl_Position = pos;",
        "}"
    ].join("\n"),

    fragment : [
        "varying vec3 vExitPoint;",
        "void main(void)",
        "{",
        "    gl_FragColor = vec4( vExitPoint, 1.0 );",
        "}"
    ].join("\n"),

    hasTransparency: function(params) { // volumes are always semi-transparent
        return true; 
    },

    uniforms : {}
});
