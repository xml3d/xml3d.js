
Xflow.registerOperator("xflow.rgbePNGtoFloat", {
    outputs: [ {type: 'texture', name : 'result', customAlloc: true } ],
    params:  [
        {type: 'texture', source : 'image'}
    ],
    alloc: function (sizes, image) {
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        samplerConfig.minFilter = Xflow.TEX_FILTER_TYPE.NEAREST;
        samplerConfig.magFilter = Xflow.TEX_FILTER_TYPE.NEAREST;
        sizes["result"] = {
            imageFormat : {
                width: image.width,
                height: image.height,
                texelType: Xflow.TEXTURE_TYPE.FLOAT,
                texelFormat: Xflow.TEXTURE_FORMAT.RGB
            },
            samplerConfig: samplerConfig
        }
    },

    evaluate: function(result, image) {
        for (var idx = 0; idx < image.data.length; idx += 4) {
            var rgbe = image.data.subarray(idx, idx + 4);
            var f = 0.0;
            var e = rgbe[3];

            if (e > 0.0)
                f = Math.pow(2.0, e - (128.0 + 8.0));

            var rgb = new Float32Array(3);
            rgb[0] = rgbe[0] * f;
            rgb[1] = rgbe[1] * f;
            rgb[2] = rgbe[2] * f;
            result.data.set(rgb, idx / 4 * 3);
        }
        return true;
    }
});
