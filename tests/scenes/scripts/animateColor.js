Xflow.registerOperator("xflow.animateColor", {
    outputs: [	{type: 'float3', name: 'diffuseColor'}],
    params:  [{type: 'float', source: 'time'}],
    platforms: ["JAVASCRIPT", "GLSL_VS"],
    evaluate: function(diffuseColor,time) {
    	var d = new Date();
    	diffuseColor[0] = Math.cos(time[0]/500);
    	diffuseColor[1] = Math.sin(time[0]/500);
    	diffuseColor[2] = Math.tan(time[0]/500);
    	return diffuseColor;
    }
});

