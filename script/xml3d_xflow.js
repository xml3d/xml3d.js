
/**
 * Begin XFlow scripts
 * 
 * XFlow scripts can create vertex data or alter it through CPU scripts and/or shaders.
 * 
 */
org.xml3d.xflow.plane = function(dataTable) {
	var segments = dataTable.segments;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;	
	if (segments <= 0)
		return;
	
	var numVertices = (segments+1)*(segments+1);
	var numIndices = (segments*segments) * 6;
	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	var quadLength = 2 / segments;
	
	for (var i=0; i<segments+1; i++)
	for (var j=0; j<segments+1; j++) {
		var x = -1.0 + i*quadLength;
		var y = -1.0 + j*quadLength;
		var u = i / segments;
		var v = j / segments;
		var ind = j * (segments+1) + i;
		
		position.set([x, 0, y], ind*3);
		normal.set([0,1,0], ind*3);
		texcoord.set([u,v], ind*2);		
	}
	
	var quadIndex = 0;
	
	for (var i=0; i<segments; i++)
	for (var j=0; j<segments; j++) {
		var i0 = j * (segments+1) + i;
		var i1 = i0 + 1;
		var i2 = (j+1) * (segments+1) + i;
		var i3 = i2 + 1;
		
		index.set([i0, i1, i2, i2, i1, i3], quadIndex);
		quadIndex += 6;
	}

	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };		
};

org.xml3d.xflow.box = function(dataTable) {
	var segments = dataTable.segments;
	var size = dataTable.size;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;
	size = size !== undefined && size.data ? size.data[0] : 2.0;
	
	if (segments <= 0 || size <= 0)
		return;
	
	var halfSize = size / 2.0;
	var numTrianglesPerFace = segments * segments * 2;
	var numIndicesPerFace = numTrianglesPerFace * 3;
	var numIndices = numIndicesPerFace * 6;
	var numVerticesPerFace = (segments+1)*(segments+1);
	var numVertices = numVerticesPerFace * 6;
	
	var quadLength = size / segments;
	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	var faceNormals = [ [0,-1,0],
	                    [0,1,0],
	                    [-1,0,0],
	                    [1,0,0],
	                    [0,0,-1],
	                    [0,0,1]
	                  ];
	
	for (var k=0; k<6; k++) {
		for (var i=0; i<segments+1; i++)
		for (var j=0; j<segments+1; j++) {
			var x = -halfSize + i*quadLength;
			var y = -halfSize + j*quadLength;
			
			var ind = j * (segments+1) + i + k*numVerticesPerFace;
			
			var u = i/segments;
			var v = j/segments;
			
			switch (k) {
			case 0:
				position.set([x, -halfSize, y], ind*3); break;
			case 1:
				position.set([x, halfSize, y], ind*3); break;
			case 2:
				position.set([-halfSize, x, y], ind*3); break;
			case 3:
				position.set([halfSize, x, y], ind*3); break;
			case 4:
				position.set([x, y, -halfSize], ind*3); break;
			case 5:
				position.set([x, y, halfSize], ind*3); break;
			}
			
			normal.set(faceNormals[k], ind*3);
			texcoord.set([u, v], ind*2);			
		}	
	}
	
	var quadIndex = 0;
	
	for (var k=0; k<6; k++) {
		for (var i=0; i<segments; i++)
		for (var j=0; j<segments; j++) {
			var i0 = j * (segments+1) + i + k*numVerticesPerFace;
			var i1 = i0 + 1;
			var i2 = (j+1) * (segments+1) + i + k*numVerticesPerFace;
			var i3 = i2 + 1;
			
			index.set([i0, i1, i2, i2, i1, i3], quadIndex);
			quadIndex += 6;
		}
	}
	
	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };                   
};

org.xml3d.xflow.sphere = function(dataTable) {
	var segments = dataTable.segments;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;
	
	if (segments <= 0)
		return;
	
	var numTriangles = segments * segments * 2;
	var numIndices = numTriangles * 3;
	var numVertices = (segments+1)*(segments+1);

	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	for (var i=0; i<segments+1; i++)
	for (var j=0; j<segments+1; j++) {
		var u = i/segments;
		var v = j/segments;
		
		var theta = u*Math.PI;
		var phi = v*Math.PI*2;
		
		var x = Math.sin(theta) * Math.cos(phi);
		var y = Math.cos(theta);
		var z = -Math.sin(theta) * Math.sin(phi);
		
		var ind = j * (segments+1) + i;
		var n = new XML3DVec3(x,y,z).normalize();
		
		position.set([x,y,z], ind*3);
		normal.set([n.x, n.y, n.z], ind*3);
		texcoord.set([v, 1-u], ind*2);
	}
	
	var quadIndex = 0;
	
	for (var i=0; i<segments; i++)
	for (var j=0; j<segments; j++) {
		var i0 = j * (segments+1) + i;
		var i1 = i0 + 1;
		var i2 = (j+1) * (segments+1) + i;
		var i3 = i2 + 1;
		
		index.set([i0, i1, i2, i2, i1, i3], quadIndex);
		quadIndex += 6;
	}

	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };
};

org.xml3d.xflow.cylinder = function(dataTable) {
	var segments = dataTable.segments;
	segments = segments !== undefined && segments.data ? segments.data[0] : 1;
	
	if (segments <= 0)
		return;
	
	var numTrianglesCap = segments - 2;
	var numTrianglesSide = segments*segments * 2;
	var numTriangles = numTrianglesSide + 2*numTrianglesCap;
	var numIndices = numTriangles * 3;
	
	var numVerticesCap = segments;
	var numVerticesSide = (segments+1)*(segments+1);
	var numVertices = numVerticesSide + numVerticesCap*2;
	
	var index = new Int32Array(numIndices); 
	var position = new Float32Array(numVertices*3); 
	var normal = new Float32Array(numVertices*3); 
	var texcoord = new Float32Array(numVertices*2);
	
	//Create vertices for body
	for (var i=0; i<segments+1; i++)
	for (var j=0; j<segments+1; j++) {
		var u = i/segments;
		var v = j/segments;
		
		var x = Math.sin(u * 2 * Math.PI);
		var y = Math.cos(u * 2 * Math.PI);
		var z = (v - 0.5)*2;
		
		var ind = j * (segments+1) + i;
		var n = new XML3DVec3(x,0,y).normalize();
		
		position.set([x,z,y], ind*3);
		normal.set([n.x, n.y, n.z], ind*3);
		texcoord.set([u,v], ind*2);
	}
	
	//Create vertices for caps
	for( var k=0; k<2; k++)
    for( var i=0; i<segments; i++) {
    	var u = i/segments;
		
    	var x = Math.sin(u * 2 * Math.PI);
		var y = Math.cos(u * 2 * Math.PI);
		var z = (k - 0.5)*2;
		
		var ind = i + k*numVerticesCap + numVerticesSide;
		
		position.set([x,z,y], ind*3);
		if (k==1)
			normal.set([0,-1,0], ind*3);
		else
			normal.set([0,1,0], ind*3);
		texcoord.set([x,y], ind*2);
    }
	
	var quadIndex = 0;
	
	//Create triangles for body
	for (var i=0; i<segments; i++)
	for (var j=0; j<segments; j++) {
		var i0 = j * (segments+1) + i;
		var i1 = i0 + 1;
		var i2 = (j+1) * (segments+1) + i;
		var i3 = i2 + 1;
		
		index.set([i0, i1, i2, i2, i1, i3], quadIndex);
		quadIndex += 6;
	}
	
	//Create triangles for caps
	for( var k=0; k<2; k++)
    for( var i=0; i<(segments-2); i++) {
    	var i0 = numVerticesSide + k*numVerticesCap;
    	var i1 = i0 + i + 1;
    	var i2 = i1 + 1;
    	
    	index.set([i0,i1,i2], quadIndex);
    	quadIndex += 3;
    }
	
	dataTable.index = { data : index, tupleSize : 1 };
	dataTable.position = { data : position, tupleSize : 3};
	dataTable.normal = { data : normal, tupleSize : 3 };
	dataTable.texcoord = { data : texcoord, tupleSize : 2 };
};

org.xml3d.xflow.ripple = function(dataTable) {
	if (!dataTable.position || !dataTable.strength || !dataTable.wavelength || ! dataTable.phase) {
		org.xml3d.debug.logError("Missing data for XFlow Ripple script!");
		return;
	}
	
	var sd = 
		 "\n uniform float strength;\n"
		+"uniform float wavelength;\n"
		+"uniform float phase;\n";
	
	var sb = 
		 " 	  float dist = sqrt(pos.x*pos.x + pos.z*pos.z);\n"
		+"    float height = sin(dist * wavelength + phase)*strength;\n"
		+"    pos = vec3(pos.x, pos.y+height, pos.z);\n"
		//TODO: Normals
		;
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["strength"] = dataTable.strength;
	dataTable.xflowShader.uniforms["wavelength"] = dataTable.wavelength;
	dataTable.xflowShader.uniforms["phase"] = dataTable.phase;
	delete dataTable.strength;
	delete dataTable.wavelength;
	delete dataTable.phase;

};

org.xml3d.xflow.morphing = function(dataTable) {
	if (!dataTable.position1 || !dataTable.position2 || !dataTable.weight1 || ! dataTable.weight2) {
		org.xml3d.debug.logError("Missing data for XFlow Morphing script!");
		return;
	}
	
	var sd = 
		"\n attribute vec3 position1;\n"
		+"attribute vec3 position2;\n"
		+"uniform float weight1;\n"
		+"uniform float weight2;\n";
	
	var sb = 
		"   pos = mix(pos, position1, weight1);\n"
	   +"   pos = mix(pos, position2, weight2);\n"
		//TODO: Normals
		;
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["weight1"] = dataTable.weight1;
	dataTable.xflowShader.uniforms["weight2"] = dataTable.weight2;
	delete dataTable.weight1;
	delete dataTable.weight2;	
	
};

org.xml3d.xflow.noise = function(dataTable) {
	if (!dataTable.strength || !dataTable.position) {
		org.xml3d.debug.logError("Missing parameters for XFlow Noise script!");
		return;
	}
	var sd = 
		"uniform vec3 strength;\n"
		+"uniform float weight2;\n"
		+"float rand(vec3 co, vec3 pos){\n"
	    +"return fract(sin(dot(co.xy ,vec2(11.9898,69.233)) * dot(pos, co)) * 43758.5453);\n"
	    +"}\n";
	
	var sb = "";
	
	if (dataTable.seed) {
		var snum = dataTable.seed.data[0];
		sb += "vec3 seed = vec3(0.63, "+snum+", 1.5);\n";
		dataTable.xflowShader.uniforms["seed"] = dataTable.seed;
		delete dataTable.seed;
	} else {
		sb += "vec3 seed = vec3("+Math.random()*5+", "+Math.random()*3+", "+Math.random()*4+");\n";
	}
	
	sb += "pos = pos + rand(seed, pos)*strength;\n";
	//TODO: Normals
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["strength"] = dataTable.strength;
	delete dataTable.strength;	
	
};

org.xml3d.xflow.displace = function(dataTable) {

	//TODO: Texture lookup in vertex shader is not yet supported in WebGL
	delete dataTable.diffuseTexture;
	delete dataTable.strength;
	return;
	
	if (!dataTable.strength || !dataTable.diffuseTexture) {
		org.xml3d.debug.logError("Missing parameters for XFlow Displace script!");
		return;
	}
	
	var sd = "uniform sampler2D diffuseTexture;\n"
		+ "uniform float strength;\n"
		+ "attribute vec2 texcoord;\n";
	
	var sb = "vec4 d = texture2D(diffuseTexture, texcoord);\n";
	sb += "pos += norm * strength * ((d.x + d.y + d.z) / 3.0 * d.w);\n";
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	
	dataTable.xflowShader.uniforms["strength"] = dataTable.strength;
	delete dataTable.strength;
	dataTable.xflowShader.uniforms["diffuseTexture"] = dataTable.diffuseTexture;
	delete dataTable.diffuseTexture;
	
};

org.xml3d.xflow.smoothing = function(dataTable) {
	//Can't do smoothing in a vertex shader as it's not parallel
	
	var numVertices = dataTable.position.data.length / 3;
	var numTriangles = dataTable.index.data.length / 3;
	
	var newNorm = new Float32Array(numVertices*3); 
	
	for (var i = 0; i<numTriangles; i++) {
		var index0 = dataTable.index.data[i*3];
		var index1 = dataTable.index.data[i*3+1];
		var index2 = dataTable.index.data[i*3+2];
		
		var pos1 = new XML3DVec3(dataTable.position.data[index0], dataTable.position.data[index0+1],
				dataTable.position.data[index0+2]);
		var pos2 = new XML3DVec3(dataTable.position.data[index1], dataTable.position.data[index1+1],
				dataTable.position.data[index1+2]);
		var pos3 = new XML3DVec3(dataTable.position.data[index2], dataTable.position.data[index2+1],
				dataTable.position.data[index2+2]);
		
		var norm = (pos2.subtract(pos1)).cross(pos3.subtract(pos1));
		
		var n = [norm.x, norm.y, norm.z];
		
		newNorm.set(n, index0);
		newNorm.set(n, index1);
		newNorm.set(n, index2);
	}
	
	dataTable.normal = { data : newNorm, tupleSize : 3 };
	
};

org.xml3d.xflow.uv = function(dataTable) {
	
	if (!dataTable.scale || !dataTable.translate) {
		org.xml3d.debug.logError("Missing parameters for XFlow UV script!");
		return;
	}
	
	var sd = "uniform vec2 scale;\n";
	sd += "uniform vec2 translate;\n";
	
	var sb = "tex = tex * scale + translate;\n";
	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}
	dataTable.xflowShader.uniforms["scale"] = dataTable.scale;
	delete dataTable.scale;
	dataTable.xflowShader.uniforms["translate"] = dataTable.translate;
	delete dataTable.translate;
};

org.xml3d.xflow.tangent = function(dataTable) {
	
	var numVertices = dataTable.position.data.length / 3;
	var numTriangles = dataTable.index.data.length / 3;
	var tangents = new Float32Array(numVertices*3);
	
	var tan1 = new Float32Array(numVertices*3);
	
	for (var i = 0; i<numTriangles; i++) {
	try {
		var index0 = dataTable.index.data[i*3];
		var index1 = dataTable.index.data[i*3 + 1];
		var index2 = dataTable.index.data[i*3 + 2];
		
		var pos1 = new XML3DVec3(dataTable.position.data[index0], dataTable.position.data[index0+1],
				dataTable.position.data[index0+2]);
		var pos2 = new XML3DVec3(dataTable.position.data[index1], dataTable.position.data[index1+1],
				dataTable.position.data[index1+2]);
		var pos3 = new XML3DVec3(dataTable.position.data[index2], dataTable.position.data[index2+1],
				dataTable.position.data[index2+2]);
		var q1 = pos2.subtract(pos1);
		var q2 = pos3.subtract(pos1);
		
		var ti0 = 2*index0;
		var ti1 = 2*index1;
		var ti2 = 2*index2;
		
		var tex1 = new XML3DVec3(dataTable.texcoord.data[ti0], dataTable.texcoord.data[ti0+1], 0);
		var tex2 = new XML3DVec3(dataTable.texcoord.data[ti1], dataTable.texcoord.data[ti1+1], 0);
		var tex3 = new XML3DVec3(dataTable.texcoord.data[ti2], dataTable.texcoord.data[ti2+1], 0);
		var u1 = tex2.subtract(tex1);
		var u2 = tex3.subtract(tex1);
		
		var r = 1.0 / (u1.x * u2.y - u2.x * u1.y);
		var sdir = new XML3DVec3( (u2.y*q1.x - u1.y*q2.x)*r, (u2.y*q1.y - u1.y*q2.y)*r, (u2.y*q1.z - u1.y*q2.z)*r );
		var tdir = new XML3DVec3( (u1.x*q2.x - u2.x*q1.x)*r, (u1.x*q2.y - u2.x*q1.y)*r, (u1.x*q2.z - u2.x*q1.z)*r );
		
		tan1.set([ tan1[index0]+sdir.x, tan1[index0+1]+sdir.y, tan1[index0+2]+sdir.z ], index0);
		tan1.set([ tan1[index1]+sdir.x, tan1[index1+1]+sdir.y, tan1[index1+2]+sdir.z ], index1);
		tan1.set([ tan1[index2]+sdir.x, tan1[index2+1]+sdir.y, tan1[index2+2]+sdir.z ], index2);

	}catch(e) {
	}
	}
	
	for (var i = 0; i<numVertices; i++) {
		try {
		var n = new XML3DVec3(dataTable.normal.data[i], dataTable.normal.data[i+1],
				dataTable.normal.data[i+2]);
		var t = new XML3DVec3(tan1[i], tan1[i+1], tan1[i+2]);
		//var t2 = new XML3DVec3(tan2[i], tan2[i+1], tan2[i+2]);
		
		var tangent = (t.subtract(n).scale(n.dot(t))).normalize();
		tangents.set(tangent.toGL(), i);
		} catch (e) {
			var ef = e;
		}

	}
	
	dataTable.tangent = { data : tangents, tupleSize : 3 };

};

org.xml3d.xflow.skinning = function(dataTable, dataAdapter) {
	if (!dataTable.bindPose || !dataTable.boneIndices || !dataTable.boneWeights || !dataTable.pose || !dataTable.normal) {
		org.xml3d.debug.logError("Missing parameters for XFlow Skinning script!");
		return;
	}
	dataTable.bindPose.isXFlow = true;
	dataTable.boneIndices.isXFlow = true;
	dataTable.boneWeights.isXFlow = true;
	dataTable.pose.isXFlow = true;
	
	var bindPose = new Array();
	var pose = new Array();
	var numMatrices = dataTable.bindPose.data.length / 16;
	
	if (dataTable.pose.data.length != dataTable.bindPose.data.length)
		return;
	
	
	
	var sd = "uniform mat4 pose["+numMatrices+"];\n"
		+ "uniform mat4 bindPose["+numMatrices+"];\n"
		+ "attribute vec4 boneIndex;\n"
		+ "attribute vec4 boneWeight;\n";
	var sb = "";
	
	sb += "vec4 nPos = vec4(0.0);\n";
	sb += "vec4 nNorm = vec4(0.0);\n";
	sb += "vec4 index = boneIndex;\n";
	sb += "vec4 weight = boneWeight;\n";
	
	sb += "for (int i = 0; i<4; i++) { \n";
	sb += "   if (index.x < "+numMatrices+".0) {\n";
	sb += "      vec4 bindPos =  bindPose[int(index.x)] * vec4(position.xyz, 1.0);\n";
	sb += "      vec4 bindNorm = bindPose[int(index.x)] * vec4(normal.xyz, 0.0);\n";
	sb += "      vec4 posePos = pose[int(index.x)] * vec4(bindPos.xyz, 1.0);\n";
	sb += "      vec4 poseNorm = pose[int(index.x)] * vec4(bindNorm.xyz, 0.0);\n";
	sb += "      nPos += posePos * weight.x;\n";
	sb += "      nNorm += poseNorm * weight.x;\n";
	sb += "   }\n";
	sb += "   index = index.yzwx;\n";
	sb += "   weight = weight.yzwx;\n";
	sb += "}\n";
	
	sb += "float restWeight = 1.0 - (boneWeight.x + boneWeight.y + boneWeight.z + boneWeight.w);\n";
	sb += "nPos = nPos + vec4(position, 0.0) * restWeight;\n";
	sb += "nNorm = nNorm + vec4(normal, 0.0) * restWeight;\n";
	
	sb += "pos = nPos.xyz;\n";
	sb += "norm = nNorm.xyz;\n";

	
	if (dataTable.xflowShader) {
		dataTable.xflowShader.declarations += sd;
		dataTable.xflowShader.body += sb;
	} else {
		dataTable.xflowShader = {};
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.declarations = sd;
		dataTable.xflowShader.body = sb;
		dataTable.xflowShader.uniforms = {};		
	}	
	
	
	dataTable.xflowShader.uniforms["pose[0]"] = dataTable.pose;
	dataTable.xflowShader.uniforms["bindPose[0]"] = dataTable.bindPose;
	dataTable.boneIndex = { data : new Uint16Array(dataTable.boneIndices.data), tupleSize : 4 };
	//delete dataTable.boneIndices;
	dataTable.boneWeight = { data : dataTable.boneWeights.data, tupleSize : 4 };
};

org.xml3d.xflow.forwardkinematics = function(dataTable) {
	if (!dataTable.parent || !dataTable.transform) {
		org.xml3d.debug.logError("Missing parameters for XFlow Forward Kinematics script!");
		return;
	}
	dataTable.parent.isXFlow = true;
	dataTable.transform.isXFlow = true;
	var parent = dataTable.parent.data;
	var transform = new Array();
	var numJoints = dataTable.transform.data.length / 16;
	var newPose = new Array();
	
	for (var i=0; i < numJoints*16;) {
		var matTransform = new XML3DMatrix(dataTable.transform.data.subarray(i, i+16));
		transform.push(matTransform);
		newPose.push(new XML3DMatrix());
		i+=16;
	}
	
	if (parent.length != numJoints)
		return;
	
	for (var i=0; i < numJoints; i++) {
		var parentIndex = parent[i];
		var curParentMatrix = new XML3DMatrix();
		
		if ( (parentIndex >= 0) && (parentIndex < numJoints)) {
			curParentMatrix = newPose[parentIndex];
		}
		
		var curMatrix = transform[i];
		curMatrix = curMatrix.multiply(curParentMatrix);
		
		newPose[i] = curMatrix;
	}
	var newPoseArray = new Float32Array(dataTable.transform.data.length);
	for (var i=0; i<numJoints; i++) {
		newPoseArray.set(newPose[i].transpose().toGL(), i*16);
	}
	
	dataTable.pose = { data : newPoseArray, tupleSize : 16 };
	
};

org.xml3d.xflow.matrixinterpolator = function(dataTable) {
	if (!dataTable.weight) {
		org.xml3d.debug.logError("Missing parameters for XFlow Matrix Interpolator script!");
		return;
	}
	dataTable.weight.isXFlow = true;
	var weights = dataTable.weight.data;
	//var transform = dataTable.transform.data;
	
	var weightValue = weights[0];
	var index1 = Math.floor(weightValue);
	var index2 = index1 + 1;
	
	
	
	var p1 = "transform"+index1;
	var p2 = "transform"+index2;
	
	var pose1 = dataTable[p1].data;
	var pose2 = dataTable[p2].data;
	
	if (pose1.length != pose2.length)
		return;
	
	var newPose = new Float32Array(pose1.length);
	var numMatrices = pose1.length / 16;
	
	var bv = weightValue - index1;
	var onembv = 1 - bv;
	
	for (var i=0; i < numMatrices*16;) {
		newPose[i] = pose1[i] * onembv + pose2[i] * bv;
		newPose[i+1] = pose1[i+1] * onembv + pose2[i+1] * bv;
		newPose[i+2] = pose1[i+2] * onembv + pose2[i+2] * bv;
		newPose[i+3] = pose1[i+3] * onembv + pose2[i+3] * bv;
		newPose[i+4] = pose1[i+4] * onembv + pose2[i+4] * bv;
		newPose[i+5] = pose1[i+5] * onembv + pose2[i+5] * bv;
		newPose[i+6] = pose1[i+6] * onembv + pose2[i+6] * bv;
		newPose[i+7] = pose1[i+7] * onembv + pose2[i+7] * bv;
		newPose[i+8] = pose1[i+8] * onembv + pose2[i+8] * bv;
		newPose[i+9] = pose1[i+9] * onembv + pose2[i+9] * bv;
		newPose[i+10] = pose1[i+10] * onembv + pose2[i+10] * bv;
		newPose[i+11] = pose1[i+11] * onembv + pose2[i+11] * bv;
		newPose[i+12] = pose1[i+12] * onembv + pose2[i+12] * bv;
		newPose[i+13] = pose1[i+13] * onembv + pose2[i+13] * bv;
		newPose[i+14] = pose1[i+14] * onembv + pose2[i+14] * bv;
		newPose[i+15] = pose1[i+15] * onembv + pose2[i+15] * bv;
		
		i += 16;
	}
	
	dataTable.transform = { data : newPose, tupleSize : 16 };
	for (var i=0;;i++) {
		if (dataTable["transform"+i]) {
			delete dataTable["transform"+i];
		}
		else
			break;
	}
	
};

org.xml3d.xflow.instance = function(dataTable) {
	
	if ((!dataTable.pose && !dataTable.transform) || !dataTable.texcoord || !dataTable.index) {
		org.xml3d.debug.logError("Missing parameters for XFlow Instance script!");
		return;
	}
	
	if (dataTable.transform && !dataTable.pose) {
		dataTable.pose = dataTable.transform;
	}
	dataTable.pose.isXFlow = true;
	var index = dataTable.index.data;
	var position = dataTable.position.data;
	var normal = dataTable.normal.data;
	var texcoord = dataTable.texcoord.data;
	var pose = dataTable.pose.data;
	var size = 1;
	if (dataTable.size) {
		size = dataTable.size.data[0];
	}
	
	var numIndices = index.length;
	var numVertices = position.length / 3;
	var numInstances = pose.length / 16;
	
	var newIndex = new Int32Array(numIndices * numInstances);
	var newPos = new Float32Array(numVertices*3 * numInstances);
	var newNorm = new Float32Array(numVertices*3 * numInstances);
	var newTexcoord = new Float32Array(numVertices*2 * numInstances);
	
	for (var j=0; j<numInstances; j++) {
		var matrix = new XML3DMatrix(pose.subarray(j*16, (j*16)+16)).transpose();
		
		for (var i=0; i < numIndices; i++) {
			var curIndex = index[i];
			curIndex += j * numVertices;
			
			var instanceIndex = j * numIndices + i;
			
			newIndex.set([curIndex], instanceIndex);
		}	
		
		for (var i=0; i < numVertices; i++) {
			var curPos = new XML3DVec3(position[i*3], position[i*3+1], position[i*3+2]);
			var curNorm = new XML3DVec3(normal[i*3], normal[i*3+1], normal[i*3+2]);
			
			var transformedPos = matrix.mulVec3(curPos, 1).scale(size);
			var transformedNorm = matrix.mulVec3(curNorm, 1);
			
			var instanceIndex = j * numVertices*3 + i*3;
			var texindex = j * numVertices*2 + i*2;
			
			newPos.set(transformedPos.toGL(), instanceIndex);
			newNorm.set(transformedNorm.normalize().toGL(), instanceIndex);
			newTexcoord.set([texcoord[i*2], texcoord[i*2+1]], texindex);
		}	
	}
	
	dataTable.index = { data : newIndex, tupleSize : 1 };
	dataTable.position = { data : newPos, tupleSize : 3 };
	dataTable.normal = { data : newNorm, tupleSize : 3 };
	dataTable.texcoord = { data : newTexcoord, tupleSize : 2 };
	if (dataTable.size)
		delete dataTable.size;
	

};
