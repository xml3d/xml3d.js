// Code portions from http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
(function() {
    Xflow.Filters = {};

    var tmpCanvas = null;
    var tmpCtx = null;

    Xflow.Filters.createImageData = function(w,h) {
        if (!tmpCanvas)
            tmpCanvas = document.createElement('canvas');
        if (!tmpCtx)
            tmpCtx = tmpCanvas.getContext('2d');
        return tmpCtx.createImageData(w, h);
    };

    Xflow.Filters.grayscale = function(inpixels, outpixels, args) {
            var s = inpixels.data;
            var d = outpixels.data;
            for (var i=0; i<s.length; i+=4) {
                var r = s[i];
                var g = s[i+1];
                var b = s[i+2];
                var a = s[i+3];
                // CIE luminance for the RGB
                // The human eye is bad at seeing red and blue, so we de-emphasize them.
                var v = 0.2126*r + 0.7152*g + 0.0722*b;
                d[i] = d[i+1] = d[i+2] = v
                d[i+3] = a;
            }
            return inpixels;
    };

    Xflow.Filters.convolute = function(inpixels, outpixels, weights, opaque) {
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
}());

function float4(x,y,z,w) {
    var v = new Float32Array(4);
    switch (arguments.length) {
        case 0:
            v[0] = 0;
            v[1] = 0;
            v[2] = 0;
            v[3] = 0;
            break;
        case 1:
            v[0] = x;
            v[1] = x;
            v[2] = x;
            v[3] = x;
            break;
        case 2:
            v[0] = x;
            v[1] = y;
            v[2] = 0;
            v[3] = 0;
            break;
        case 3:
            v[0] = x;
            v[1] = y;
            v[2] = z;
            v[3] = 0;
            break;
        default:
            v[0] = x;
            v[1] = y;
            v[2] = z;
            v[3] = w;
    }
    return v;
}

function hypot(a, b)
{
    return Math.sqrt(a*a + b*b);
}

function hypot4(a, b)
{
    return float4(hypot(a[0], b[0]),
                  hypot(a[1], b[1]),
                  hypot(a[2], b[2]),
                  hypot(a[3], b[3]));
}

function getTexel2D(imagedata, x, y) {
    var offset = (y * imagedata.width + x) * 4;
    var data = imagedata.data;
    var color = new Float32Array(4);
    color[0] = data[offset] / 255.0;
    color[1] = data[offset+1] / 255.0;
    color[2] = data[offset+2] / 255.0;
    color[3] = data[offset+3] / 255.0;
    return color;
}

function setTexel2D(imagedata, x, y, color) {
    var offset = (y * imagedata.width + x) * 4;
    var data = imagedata.data;
    data[offset] = color[0] * 255.0 ;
    data[offset+1] = color[1] * 255.0;
    data[offset+2] = color[2] * 255.0;
    data[offset+3] = color[3] * 255.0;
}

Xflow.registerOperator("sobelImage", {
    outputs: [ {type: 'texture', name : 'result', tupleSize: '1', customAlloc: true} ],
    params:  [ {type: 'texture', name : 'image'} ],
    alloc: function(sizes, image) {
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        sizes['result'] = {
            imageFormat : {width: Math.max(image.width, 1), height: Math.max(image.height, 1)},
            samplerConfig : samplerConfig
        };
    },
    evaluate: function(result, image) {
        if (image.isLoading()) {
            result.finish();
            return false;
        }

        var srcctx = image.getContext2D();
        var destctx = result.getContext2D();

        var width = image.width;
        var height = image.height;
        var destid = destctx.getImageData(0, 0, width, height);
        var srcid = srcctx.getImageData(0, 0, width, height);

        for (var y = 0; y < height; ++y)
        {
            for (var x = 0; x < width; ++x)
            {
                var gx = float4(0.0);
                var gy = float4(0.0);

                /* Read each texel component and calculate the filtered value using neighbouring texel components */
                if ( x >= 1 && x < (width-1) && y >= 1 && y < height - 1)
                {
                    var i00 = getTexel2D(srcid, x-1, y-1);
                    var i10 = getTexel2D(srcid, x, y-1);
                    var i20 = getTexel2D(srcid, x+1, y-1);
                    var i01 = getTexel2D(srcid, x-1, y);
                    var i11 = getTexel2D(srcid, x, y);
                    var i21 = getTexel2D(srcid, x+1, y);
                    var i02 = getTexel2D(srcid, x-1, y+1);
                    var i12 = getTexel2D(srcid, x, y+1);
                    var i22 = getTexel2D(srcid, x+1, y+1);

                    gx[0] = i00[0] + 2 * i10[0] + i20[0] - i02[0]  - 2 * i12[0] - i22[0];
                    gx[1] = i00[1] + 2 * i10[1] + i20[1] - i02[1]  - 2 * i12[1] - i22[1];
                    gx[2] = i00[2] + 2 * i10[2] + i20[2] - i02[2]  - 2 * i12[2] - i22[2];

                    gy[0] = i00[0] - i20[0]  + 2*i01[0] - 2*i21[0] + i02[0]  -  i22[0];
                    gy[1] = i00[1] - i20[1]  + 2*i01[1] - 2*i21[1] + i02[1]  -  i22[1];
                    gy[2] = i00[2] - i20[2]  + 2*i01[2] - 2*i21[2] + i02[2]  -  i22[2];

                    /* taking root of sums of squares of Gx and Gy */
                    var color = hypot4(gx, gy);
                    color[0]/=2;
                    color[1]/=2;
                    color[2]/=2;
                    color[3]=1.0;
                    setTexel2D(destid, x, y, color);
                }
            }
        }

//        Xflow.Filters.convolute(srcid, destid,
//            [  0, -1,  0,
//              -1,  5, -1,
//               0, -1,  0 ]);

        // Xflow.Filters.grayscale(srcid, destid);


        /*
        var destpix = destid.data;
        var srcpix = srcid.data;

        for (var y = 0; y < height; ++y)
        {
            for (var x = 0; x < width; ++x)
            {
                var offset = (y * width + x) * 4;
                destpix[offset] =  srcpix[offset];
                destpix[offset+1] = srcpix[offset+1];
                destpix[offset+2] = srcpix[offset+2];
                destpix[offset+3] = srcpix[offset+3];
            }
        }
        */


        destctx.putImageData(destid, 0, 0);
        result.finish();
        return true;
    }
});
