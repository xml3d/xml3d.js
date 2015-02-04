var SimplexNoise = require("../../../contrib/perlin-noise-simplex.js");

Xflow.registerOperator("xflow.noiseImage", {
    outputs: [ {type: 'texture', name : 'image', customAlloc: true} ],
    params:  [ {type: 'int', source: 'width'},
               {type: 'int', source:'height'},
               {type: 'float2', source: 'scale'},
               {type: 'float', source: 'minFreq'},
               {type: 'float', source: 'maxFreq'} ],
    alloc: function(sizes, width, height, scale, minFreq, maxFreq) {
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        sizes['image'] = {
            imageFormat : {width: width[0], height :height[0]},
            samplerConfig : samplerConfig
        };
    },
    evaluate: function(image, width, height, scale, minFreq, maxFreq) {
        width = width[0];
        height = height[0];
        minFreq = minFreq[0];
        maxFreq = maxFreq[0];

        var id = image;
        var pix = id.data;
        this.noise = this.noise || new SimplexNoise();
        var noise = this.noise;

        var useTurbulence = minFreq != 0.0 && maxFreq != 0.0 && minFreq < maxFreq;

        var snoise = function(x,y) {
            return noise.noise(x, y); // noise.noise returns values in range [-1,1]
            //return 2.0 * noise.noise(x, y) - 1.0; // this code is for noise value in range [0,1]
        };

        var turbulence = function(minFreq, maxFreq, s, t) {
            var value = 0;
            for (var f = minFreq; f < maxFreq; f *= 2)
            {
                value += Math.abs(snoise(s * f, t * f))/f;
            }
            return value;
        };

        for (var y = 0; y < height; ++y)
        {
            var t = y / height * scale[1];
            var invWidth = 1.0 / width;

            for (var x = 0; x < width; ++x)
            {
                var s = x * invWidth * scale[0];
                var v = useTurbulence ? turbulence(minFreq, maxFreq, s, t) : snoise(s, t);
                var offset = (x * width + y) * 4;
                pix[offset] =  Math.floor(v * 255);
                pix[offset+1] = Math.floor(v * 255);
                pix[offset+2] = Math.floor(v * 255);
                pix[offset+3] = 255;
            }
        }

        /* Fill with green color
        for (var y = 0; y < height; ++y)
        {
            for (var x = 0; x < width; ++x)
            {
                var offset = (x * width + y) * 4;
                pix[offset] =  0
                pix[offset+1] = 255;
                pix[offset+2] = 0;
                pix[offset+3] = 255;
            }
        }
        */

        return true;
    }
});
