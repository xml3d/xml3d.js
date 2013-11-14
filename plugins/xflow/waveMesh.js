/**
 * Wave Transformation
 */
Xflow.registerOperator("xflow.waveMesh", {
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
	}
});