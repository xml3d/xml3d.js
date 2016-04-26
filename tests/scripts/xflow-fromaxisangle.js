(function () {


Xflow.registerOperator("xflow.fromAxisAngle", {
	outputs: [ {type: 'float4', name: 'rotation'} ],
	params:  [ {type: 'float4', source: 'rotation'} ],
	evaluate: function(quat, axisAngle, info) {
		throw new Error("Not used!");
	},
	evaluate_core: function(quat, axis) {
		XML3D.math.quat.setAxisAngle(quat, axis, axis[3]);
		XML3D.math.quat.normalize(quat, quat);
	}
});


})();