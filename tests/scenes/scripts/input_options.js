/*
	functions for tuning xml3d scene using form controls
*/

function onValueChange(value, parameterId) {
	document.getElementById(parameterId).textContent = value;
};

function onValueChangeByValName(value, parameterName) {
	var elements = document.getElementsByName(parameterName);
	for (var idx in elements)
		elements[idx].textContent = value;
};

function onChangeSize() {
	var sizeX = document.getElementById("sizeX").value;
	var sizeY = document.getElementById("sizeY").value;
	var sizeZ = document.getElementById("sizeZ").value;
	
	document.getElementById("test_volume_size").textContent = sizeX + " " + sizeY + " " + sizeZ;
	
	setVolumeBoundariesPosition(sizeX, sizeY, sizeZ);
};

function setVolumeBoundariesPosition(sizeX, sizeY, sizeZ) {
	var vb = document.getElementById("volumeBoundariesPosition");
	if (vb) {
		vb.textContent = " 0 0 0 " + sizeX + " 0 0 " + sizeX + " 0 " + sizeZ + " 0 0 " + sizeZ +
						 " 0 " + sizeY + " 0 " + sizeX + " " + sizeY + " 0 " + sizeX + " " + sizeY + " " + sizeZ + " 0 " + sizeY + " " + sizeZ;
	}
};

function volumeMouseOver(elem) {
	console.log(elem.attributes.id);
	
	var adapter = getWebGLAdapter(elem);
	var recCuboid = adapter.renderNode.drawable.recCuboid;

	var transform = elem.parentNode.attributes.transform.nodeValue;
	document.getElementById("volumeBoundaries").setAttribute("transform", transform);
	
	setVolumeBoundariesPosition(recCuboid.width, recCuboid.height, recCuboid.depth, transform);
};

function volumeMouseOut(elem) {
	console.log("out " + elem.attributes.id.nodeValue);
	
	setVolumeBoundariesPosition(0, 0, 0);
};

function getWebGLAdapter(elem) {
	if (elem._configured) {
		for (var i in elem._configured.adapters) {
			if (i.indexOf("webgl") == 0) {
				return elem._configured.adapters[i];
			}
		}
	}
	return null;
};
