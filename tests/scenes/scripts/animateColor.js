Xflow.registerOperator("xflow.animateColor", {
    outputs: [	{type: 'float3', name: 'diffuseColor'}],
    params:  [{type: 'float', source: 'time'}],
    platforms: ["JAVASCRIPT", "GLSL_VS"],
    evaluate: function(diffuseColor,time) {
    	var d = new Date();
    	diffuseColor[0] = time[0];
    	diffuseColor[1] = 0;
    	diffuseColor[2] = time[0];
    	return diffuseColor;
    }
});

