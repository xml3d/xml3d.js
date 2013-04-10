// Code portions from http://www.html5rocks.com/en/tutorials/canvas/imagefilters/

(function() {

    function convolute(inpixels, outpixels, weights, opaque) {
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side/2);
        var src = inpixels.data;
        var sw = inpixels.width;
        var sh = inpixels.height;
        // pad output by the convolution matrix
        var w = sw;
        var h = sh;
        var dst = outpixels.data;
        // go through the destination image pixels
        var alphaFac = opaque ? 1 : 0;
        for (var y=0; y<h; y++) {
            for (var x=0; x<w; x++) {
                var sy = y;
                var sx = x;
                var dstOff = (y*w+x)*4;
                // calculate the weighed sum of the source image pixels that
                // fall under the convolution matrix
                var r=0, g=0, b=0, a=0;
                for (var cy=0; cy<side; cy++) {
                    for (var cx=0; cx<side; cx++) {
                        var scy = sy + cy - halfSide;
                        var scx = sx + cx - halfSide;
                        if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
                            var srcOff = (scy*sw+scx)*4;
                            var wt = weights[cy*side+cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff+1] * wt;
                            b += src[srcOff+2] * wt;
                            a += src[srcOff+3] * wt;
                        }
                    }
                }
                dst[dstOff] = r;
                dst[dstOff+1] = g;
                dst[dstOff+2] = b;
                dst[dstOff+3] = a + alphaFac*(255-a);
            }
        }
        return outpixels;
    };

    Xflow.registerOperator("convoluteImage", {
        outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
        params:  [
            {type: 'texture', source : 'image'},
            {type: 'float', source : 'kernel'}
        ],
        evaluate: function(result, image, kernel) {
            convolute(image, result, kernel, true);
            return true;
        }
    });

    Xflow.registerOperator("convoluteImageToFloat", {
        outputs: [ {type: 'texture', name : 'result', sizeof: 'image', formatType : 'float32'} ],
        params:  [
            {type: 'texture', source : 'image'},
            {type: 'float', source : 'kernel'}
        ],
        evaluate: function(result, image, kernel) {
            convolute(image, result, kernel, true);
            return true;
        }
    });

})();
