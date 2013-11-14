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
	var normals = file.body.normals;
	var generatedNormals = false;
	if (!normals) {
	 	normals = CTM.calcSmoothNormals(file.body.indices, file.body.vertices);
	 	generatedNormals = true;
	}
	var uvMaps = file.body.uvMaps ? [{uv : file.body.uvMaps[0].uv}] : null;

	var message = {
		type: "file",
		id: message.id,
		indices: indices ,
		vertices: vertices,
		normals: normals,
		uvMaps: uvMaps
	};

	// We just need to reference one ArrayBuffer as a transferable as all ArrayBufferViews in `file.body` reference the same underlying ArrayBuffer. 
	var transferables = [indices.buffer];
	// If, however, normals were not present and generated instead, their underlying buffer is separate and has to be trasnfered, too.
	if (generatedNormals)
		transferables.push(normals.buffer);
	
	// Because of [Bug 861925](https://bugzilla.mozilla.org/show_bug.cgi?id=861925) and [Bug 842081](https://bugzilla.mozilla.org/show_bug.cgi?id=842081) we cannot transfere the buffers back to the main
	// thread in current Firefox Versions. The first working version of Firefox that fixes those bugs is the current Aurora beta version `27.0`.
	var isFirefox = navigator.userAgent.indexOf("Firefox") !== -1;
	if (isFirefox) {
		// User agent string looks like this: Firefox/27.0. So version number is eight characters away from the first index of "Firefox".
		var version = parseFloat(navigator.userAgent.substring(navigator.userAgent.indexOf('Firefox') + 8));
		if (version >= 27.0) {
			self.postMessage(message, transferables);
		}
		else
			self.postMessage(message);
	} else {
		self.postMessage(message, transferables);
	}
}
