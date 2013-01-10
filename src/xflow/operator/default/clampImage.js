Xflow.registerOperator("clampImage", {
    outputs: [ {type: 'texture', name : 'result', customAlloc: true} ],
    params:  [ {type: 'texture', source : 'image'},
               {type: 'float', source : 'min'},
               {type: 'float', source : 'max'}
             ],
    alloc: function(sizes, image, min, max) {
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        sizes['result'] = {
            imageFormat : {width: Math.max(image.width, 1), height: Math.max(image.height, 1)},
            samplerConfig : samplerConfig
        };
    },
    evaluate: function(result, image, min, max) {
        var inpix = image.data;
        var outpix = result.data;
        var minv = min[0];
        var maxv = max[0];
        var len = image.data.length;
        for (var i = 0 ; i < len; i++) {
            var val = inpix[i];
            if (val < minv) val = minv;
            if (val > maxv) val = maxv;
            outpix[i] = val;
        }
        return true;
    }
});
