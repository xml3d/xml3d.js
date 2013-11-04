/**
 * Grid Generation
 */
Xflow.registerOperator("xflow.createGrid", {
    outputs: [	{type: 'float3', name: 'position', customAlloc: true},
				{type: 'float3', name: 'normal', customAlloc: true},
				{type: 'float2', name: 'texcoord', customAlloc: true},
				{type: 'int', name: 'index', customAlloc: true}],
    params:  [{type: 'int', source: 'size', array: true}],
    alloc: function(sizes, size)
    {
        var s = size[0];
        sizes['position'] = s* s;
        sizes['normal'] = s* s;
        sizes['texcoord'] = s* s;
        sizes['index'] = (s-1) * (s-1) * 6;
    },
    evaluate: function(position, normal, texcoord, index, size) {
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
	}
});