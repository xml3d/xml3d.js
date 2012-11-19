Xflow.registerOperator("noiseImage", {
    outputs: [{name: 'image', tupleSize: '1'}],
    params:  ['width','height','scale','minFreq','maxFreq'],
    evaluate: function(width,height,scale,minFreq,maxFreq) {
        var img = document.createElement('canvas');
        width = width[0];
        height = height[0];
        minFreq = minFreq[0];
        maxFreq = maxFreq[0];

        img.width =  width;
        img.height = height;
        var ctx = img.getContext("2d");
        if(!ctx)
            throw("Could not create 2D context.");

        var id = ctx.getImageData(0, 0, width, height);
        var pix = id.data;
        this.noise = this.noise || new SimplexNoise();
        var noise = this.noise;

        var useTurbulence = minFreq != 0.0 && maxFreq != 0.0 && minFreq < maxFreq;

        var snoise = function(x,y) {
            return 2.0 * noise.noise(x, y) - 1.0;
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

        ctx.putImageData(id, 0, 0);
        //console.log(img);
        this.image = img;
        return true;
    }
});