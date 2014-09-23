/**
 * Grid Generation
 */
Xflow.registerOperator("xflow.mygrid", {
    outputs: [	{type: 'float3', name: 'position', customAlloc: true},
				{type: 'float3', name: 'normal', customAlloc: true},
				{type: 'float2', name: 'texcoord', customAlloc: true},
				{type: 'int', name: 'index', customAlloc: true},
				{type: 'float3', name: 'boundingBox', customAlloc: true}],
    params:  [{type: 'int', source: 'size', array: true}],
    alloc: function(sizes, size)
    {
        var s = size[0];
        sizes['position'] = s* s;
        sizes['normal'] = s* s;
        sizes['texcoord'] = s* s;
        sizes['index'] = (s-1) * (s-1) * 6;
        sizes['boundingBox'] = 2;
    },
    evaluate: function(position, normal, texcoord, index, boundingBox, size) {
		var s = size[0];

        // Create Positions
		for(var i = 0; i < position.length / 3; i++) {
			var offset = i*3;
			position[offset] =  (((i % s) / (s-1))-0.5)*2;
			position[offset+1] = 0;
			position[offset+2] = ((Math.floor(i/s) / (s-1))-0.5)*2;
		}

        // Create Normals
		for(var i = 0; i < normal.length / 3; i++) {
			var offset = i*3;
			normal[offset] =  0;
			normal[offset+1] = 1;
			normal[offset+2] = 0;
		}
        // Create Texture Coordinates
		for(var i = 0; i < texcoord.length / 2; i++) {
			var offset = i*2;
            texcoord[offset] = (i%s) / (s-1);
            texcoord[offset+1] = Math.floor(i/s) / (s-1);
		}

        // Create Indices
		var length = (s-1) * (s-1);
		for(var i = 0; i < length; i++) {
			var offset = i*6;
			var base = i + Math.floor(i / (s-1));
			index[offset+0] = base;
			index[offset+1] = base + 1;
			index[offset+2] = base + s;
			index[offset+4] = base + s;
			index[offset+3] = base + 1;
			index[offset+5] = base + s + 1;
		}
		boundingBox[0] = boundingBox[1] = boundingBox[2] = -1;
        boundingBox[3] = boundingBox[4] = boundingBox[5] = 1;
	}
});

/**
 * Wave Transformation
 */
Xflow.registerOperator("xflow.mywave", {
	outputs: [	{type: 'float3', name: 'position'},
				{type: 'float3', name: 'normal'} ],
    params:  [  {type: 'float3', source: 'position' },
                {type: 'float3', source: 'normal' },
                {type: 'float',  source: 'strength'},
                {type: 'float',  source: 'wavelength'},
                {type: 'float',  source: 'phase'}],
    evaluate: function(newpos, newnormal, position, normal, strength, wavelength, phase, info) {

		for(var i = 0; i < info.iterateCount; i++) {
			var offset = i*3;
			var dist = Math.sqrt(position[offset]*position[offset]+position[offset+2]*position[offset+2]);
			newpos[offset] = position[offset];
			newpos[offset+1] = Math.sin(wavelength[0]*dist-phase[0])*strength[0];
			newpos[offset+2] = position[offset+2];


			var tmp = Math.cos(wavelength[0]*dist-phase[0]) * wavelength[0] * strength[0];
            var dx = position[offset] / dist * tmp;
			var dz = position[offset+2] / dist * tmp;

			var v = XML3D.math.vec3.create();
            v[0] = dx; v[1] = 1; v[2] = dz;
            XML3D.math.vec3.normalize(v, v);
			newnormal[offset] = v[0];
			newnormal[offset+1] = v[1];
			newnormal[offset+2] = v[2];
		}
	},
	evaluate_shadejs: function(position, normal, strength, wavelength, phase){
	    var dist = position.xz().length();
	    var height = Math.sin(wavelength*dist - phase)*strength;

	    var tmp = Math.cos(wavelength*dist - phase) * wavelength * strength;
	    var dx = position.x() / dist * tmp;
        var dz = position.z() / dist * tmp;

        return {
            position: position.y(height),
            normal: new Vec3(dx, 1, dz).normalize()
        };
	}
});
