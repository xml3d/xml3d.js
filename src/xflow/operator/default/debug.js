(function(){

var c_CubePositions =  [
    [-1,-1,-1], [1,-1,-1], [-1,1,-1], [1,1,-1], // front
    [-1,-1,-1], [-1,-1,1], [-1,1,-1], [-1,1,1], // left
    [-1,-1,-1], [1,-1,-1], [-1,-1,1], [1,-1,1], // top
    [1,-1,-1], [1,1,-1], [1,-1,1], [1,1,1],     // right
    [-1,1,-1], [1,1,-1], [-1,1,1], [1,1,1],     // bottom
    [-1,-1,1], [1,-1,1], [-1,1,1], [1,1,1]      // back
];
var c_CubeNormals =  [
    [0,0,-1], [0,0,-1], [0,0,-1], [0,0,-1], // front
    [-1,0,0], [-1,0,0], [-1,0,0], [-1,0,0], // left
    [0,-1,0], [0,-1,0], [0,-1,0], [0,-1,0], // top
    [1,0,0], [1,0,0], [1,0,0], [1,0,0],     // right
    [0,1,0], [0,1,0], [0,1,0], [0,1,0],     // bottom
    [0,0,1], [0,0,1], [0,0,1], [0,0,1]      // back
];
var c_CubeIndex = [
    [0,1,2,1,2,3],
    [4,5,6,5,6,7],
    [8,9,10,9,10,11],
    [12,13,14,13,14,15],
    [16,17,18,17,18,19],
    [20,21,22,21,22,23]
]

/**
 * Grid Generation
 */
Xflow.registerOperator("xflow.debug.createSkinCubes", {
    outputs: [	{type: 'int', name: 'index', customAlloc: true},
                {type: 'float3', name: 'position', customAlloc: true},
				{type: 'float3', name: 'normal', customAlloc: true},
				{type: 'int4', name: 'boneIdx', customAlloc: true},
				{type: 'float4', name: 'boneWeight', customAlloc: true}],
    params:  [{type: 'float4x4', source: 'bindTransforms', array: true},
              {type: 'float', source: 'size', array: true, optional: true}],
    alloc: function(sizes, bindTransforms)
    {
        var s = bindTransforms.length / 16;
        sizes['position'] = s * 4 * 6;
        sizes['normal'] = s * 4 * 6;
        sizes['boneIdx'] = s * 4 * 6;
        sizes['boneWeight'] = s * 4 * 6;
        sizes['index'] = s * 6 * 6;
    },
    evaluate: function(index, position, normal, boneIdx, boneWeight, bindTransforms, size) {
		var cubeCount = bindTransforms.length / 16;
		var size = (size && size[0] || 1) / 2;

        var tmpPosition = XML3D.math.vec3.create(),
            tmpNormal = XML3D.math.vec3.create();

		for(var i = 0; i < cubeCount; ++i){
            for(var j = 0; j < 6; ++j){
                for(var k = 0; k < 4; k++){
                    var localIdx = j*4+ k, globalIdx = i*6*4 + localIdx;

                    XML3D.math.vec3.copy(tmpPosition, c_CubePositions[localIdx]);
                    XML3D.math.vec3.scale(tmpPosition, tmpPosition, size);
                    XML3D.math.mat4.multiplyOffsetVec3(bindTransforms, i*16, tmpPosition, 0);
                    XML3D.math.vec3.copy(tmpNormal, c_CubeNormals[localIdx]);
                    XML3D.math.mat4.multiplyOffsetDirection(bindTransforms, i*16, tmpNormal, 0);

                    position[globalIdx*3+0] = tmpPosition[0];
                    position[globalIdx*3+1] = tmpPosition[1];
                    position[globalIdx*3+2] = tmpPosition[2];
                    normal[globalIdx*3+0] = tmpNormal[0];
                    normal[globalIdx*3+1] = tmpNormal[1];
                    normal[globalIdx*3+2] = tmpNormal[2];
                    boneIdx[globalIdx*4+0] = i;
                    boneIdx[globalIdx*4+1] = boneIdx[globalIdx*4+2] = boneIdx[globalIdx*4+3]= 0;
                    boneWeight[globalIdx*4+0] = 1;
                    boneWeight[globalIdx*4+1] = boneWeight[globalIdx*4+2] = boneWeight[globalIdx*4+3]= 0;
                }
                var globalIndexIdx = i*6*6 + j*6;
                for(var k = 0; k < 6; ++k){
                    index[globalIndexIdx+k] = i*6*4 + c_CubeIndex[j][k];
                }
            }
		}
		// We are done!
		position = position;
	}
});

}());