importScripts("ctm.js", "lzma.js");

self.addEventListener("message", function (event) {
	var message = event.data;
	switch (message.type) {
		case "decodeFile":
			decodeOpenCTM(message);
			break;
		case "close":
			self.close();
			break;
		default:
			var e = new Error("Unrecognized message received: " + message.type);
			e.id = message.id;
			throw e;
	}
});

function decodeOpenCTM(message) {
	var data = message.stream;
	if (!data instanceof ArrayBuffer)
		throw new Error("ArrayBuffer required");

	try {
		var stream = new CTM.Stream(data);
		var file = new CTM.File(stream);
	} catch (_) {
		var e = new Error("Failed to process OpenCTM file.");
		e.id = message.id;
		throw e;
	}

	var indices = new Int32Array(file.body.indices.buffer, file.body.indices.byteOffset, file.body.indices.length);
	var vertices = file.body.vertices;
	var normals = file.body.normals ? file.body.normals : CTM.calcSmoothNormals(file.body.indices, file.body.vertices);
	var uvMaps = file.body.uvMaps ? [{uv : file.body.uvMaps[0].uv}] : null;

	var message = {
		type: "file",
		id: message.id,
		indices: indices ,
		vertices: vertices,
		normals: normals,
		uvMaps: uvMaps
	};

	var transferables = [indices.buffer, vertices.buffer];
	if (normals)
		transferables.push(normals.buffer);
	if (uvMaps)
		transferables.push(uvMaps[0].uv.buffer);

	self.postMessage(message, transferables);
}
