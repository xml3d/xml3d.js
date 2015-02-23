
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

    Xflow.Filters.createImageDataFloat32 = function(w, h) {
        return {width: w, height: h, data: new Float32Array(w * h * 4)};
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
/*
    Xflow.Filters.convoluteFloat32 = function(pixels, weights, opaque) {
        var side = Math.round(Math.sqrt(weights.length));
        var halfSide = Math.floor(side / 2);

        var src = pixels.data;
        var sw = pixels.width;
        var sh = pixels.height;

        var w = sw;
        var h = sh;
        var output = {
            width: w, height: h, data: new Float32Array(w * h * 4)
        };
        var dst = output.data;

        var alphaFac = opaque ? 1 : 0;

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var sy = y;
                var sx = x;
                var dstOff = (y * w + x) * 4;
                var r = 0, g = 0, b = 0, a = 0;
                for (var cy = 0; cy < side; cy++) {
                    for (var cx = 0; cx < side; cx++) {
                        var scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
                        var scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
                        var srcOff = (scy * sw + scx) * 4;
                        var wt = weights[cy * side + cx];
                        r += src[srcOff] * wt;
                        g += src[srcOff + 1] * wt;
                        b += src[srcOff + 2] * wt;
                        a += src[srcOff + 3] * wt;
                    }
                }
                dst[dstOff] = r;
                dst[dstOff + 1] = g;
                dst[dstOff + 2] = b;
                dst[dstOff + 3] = a + alphaFac * (255 - a);
            }
        }
        return output;
    }
*/
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

function hypot4To(r, a, b)
{
    r[0] = hypot(a[0], b[0]);
    r[1] = hypot(a[1], b[1]);
    r[2] = hypot(a[2], b[2]);
    r[3] = hypot(a[3], b[3]);
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

function getTexel2DTo(color, imagedata, x, y) {
    var offset = (y * imagedata.width + x) * 4;
    var data = imagedata.data;
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

Xflow.registerOperator("xflow.sobelImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
    params:  [ {type: 'texture', source : 'image'} ],
    evaluate: function(result, image) {
        var width = image.width;
        var height = image.height;

        // Sobel filter, AnySL method
        var gx = float4(0.0);
        var gy = float4(0.0);
        var i00 = float4();
        var i00 = float4();
        var i10 = float4();
        var i20 = float4();
        var i01 = float4();
        var i11 = float4();
        var i21 = float4();
        var i02 = float4();
        var i12 = float4();
        var i22 = float4();
        var color = float4();

        for (var y = 0; y < height; ++y)
        {
            for (var x = 0; x < width; ++x)
            {
                /* Read each texel component and calculate the filtered value using neighbouring texel components */
                if ( x >= 1 && x < (width-1) && y >= 1 && y < height - 1)
                {
                    getTexel2DTo(i00, image, x-1, y-1);
                    getTexel2DTo(i10, image, x, y-1);
                    getTexel2DTo(i20, image, x+1, y-1);
                    getTexel2DTo(i01, image, x-1, y);
                    getTexel2DTo(i11, image, x, y);
                    getTexel2DTo(i21, image, x+1, y);
                    getTexel2DTo(i02, image, x-1, y+1);
                    getTexel2DTo(i12, image, x, y+1);
                    getTexel2DTo(i22, image, x+1, y+1);

                    gx[0] = i00[0] + 2 * i10[0] + i20[0] - i02[0]  - 2 * i12[0] - i22[0];
                    gx[1] = i00[1] + 2 * i10[1] + i20[1] - i02[1]  - 2 * i12[1] - i22[1];
                    gx[2] = i00[2] + 2 * i10[2] + i20[2] - i02[2]  - 2 * i12[2] - i22[2];

                    gy[0] = i00[0] - i20[0]  + 2*i01[0] - 2*i21[0] + i02[0]  -  i22[0];
                    gy[1] = i00[1] - i20[1]  + 2*i01[1] - 2*i21[1] + i02[1]  -  i22[1];
                    gy[2] = i00[2] - i20[2]  + 2*i01[2] - 2*i21[2] + i02[2]  -  i22[2];

                    /* taking root of sums of squares of Gx and Gy */
                    hypot4To(color, gx, gy);
                    color[0]/=2;
                    color[1]/=2;
                    color[2]/=2;
                    color[3]=1.0;
                    setTexel2D(result, x, y, color);
                }
            }
        }



// Sobel filter with separate steps
//
//        var vertical = Xflow.Filters.createImageDataFloat32(width, height);
//        Xflow.Filters.convolute(result, vertical,
//            [ -1, 0, 1,
//              -2, 0, 2,
//              -1, 0, 1 ]);
//        var horizontal = Xflow.Filters.createImageDataFloat32(width, height);
//        Xflow.Filters.convolute(result, horizontal,
//            [ -1, -2, -1,
//               0,  0,  0,
//               1,  2,  1 ]);
//
//        for (var i=0; i<result.data.length; i+=4) {
//            // make the vertical gradient red
//            var v = Math.abs(vertical.data[i]);
//            result.data[i] = v;
//            // make the horizontal gradient green
//            var h = Math.abs(horizontal.data[i]);
//            result.data[i+1] = h;
//            // and mix in some blue for aesthetics
//            result.data[i+2] = (v+h)/4;
//            result.data[i+3] = 255; // opaque alpha
//        }

        /* Copy image
        var destpix = result.data;
        var srcpix = image.data;

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
        return true;
    }
});
