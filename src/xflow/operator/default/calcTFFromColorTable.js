var SamplerConfig = require("../../interface/data.js").SamplerConfig;

/* calcTFFromColorTable  xflow operator
 builds transfer function texture from given color table (only for one dimensional transfer functions)
 color table may contain few values, intermediate values will be interpolated
 current implementation uses very simple linear interpolation algorithm
 resulting transfer function has width = max( defaultTFWidth, density.length )
 */
var defaultTFWidth = 256;

function lerpColor(prevColor, nextColor, koef) {
    // formula is taken from www.en.wikipedia.org/wiki/Linear_interpolation
    // koef = ( curDensity - prevDensity ) / ( nextDensity - prevDensity )
    return prevColor + ( nextColor - prevColor) * koef;
}

Xflow.registerOperator("xflow.calcTFFromColorTable", {
    outputs: [{type: 'texture', name: 'uTransferFunction', customAlloc: true}],
    params: [{type: 'float', source: 'density'}, {type: 'float4', source: 'color'}],

    alloc: function (sizes, density) {

        var _tfWidth = Math.max(defaultTFWidth, density.length);

        var samplerConfig = new SamplerConfig();
        samplerConfig.setDefaults();

        sizes['uTransferFunction'] = {
            imageFormat: {width: _tfWidth, height: 1}, samplerConfig: samplerConfig
        };

    },

    evaluate: function (uTransferFunction, density, color) {

        var _tfWidth = uTransferFunction.width;

        var minDensity = density[0];
        var maxDensity = density[density.length - 1];
        var step = (maxDensity - minDensity) / (_tfWidth - 1);
        var tfi;

        // first and last values can not (and should not) be interpolated, we take them as they are
        uTransferFunction.data[0] = color[0]; // R
        uTransferFunction.data[1] = color[1]; // G
        uTransferFunction.data[2] = color[2]; // B
        uTransferFunction.data[3] = color[3]; // A

        var di = 1;
        var ci = 4;
        var curDensity = minDensity + step;
        var nextDensity = density[di];
        var koef;
        var lastValueIndex = (_tfWidth - 1) * 4;

        for (tfi = 4; tfi < lastValueIndex; tfi += 4) {
            if (curDensity == nextDensity) {
                // take colors as they are from next color values
                uTransferFunction.data[tfi] = color[ci];
                uTransferFunction.data[tfi + 1] = color[ci + 1];
                uTransferFunction.data[tfi + 2] = color[ci + 2];
                uTransferFunction.data[tfi + 3] = color[ci + 3];
                ci += 4;
                di++;
                nextDensity = density[di];
                curDensity += step;
                continue;
            }
            if (curDensity > nextDensity) {
                ci += 4;
                di++;
                nextDensity = density[di];
                // interpolate colors
                koef = (curDensity - density[di - 1]) / (nextDensity - density[di - 1]);
                uTransferFunction.data[tfi] = lerpColor(color[ci - 4], color[ci], koef);
                uTransferFunction.data[tfi + 1] = lerpColor(color[ci - 3], color[ci + 1], koef);
                uTransferFunction.data[tfi + 2] = lerpColor(color[ci - 2], color[ci + 2], koef);
                uTransferFunction.data[tfi + 3] = lerpColor(color[ci - 1], color[ci + 3], koef);

                curDensity += step;
                continue;
            }
            // interpolate colors
            koef = (curDensity - density[di - 1]) / (nextDensity - density[di - 1]);
            uTransferFunction.data[tfi] = lerpColor(color[ci - 4], color[ci], koef);
            uTransferFunction.data[tfi + 1] = lerpColor(color[ci - 3], color[ci + 1], koef);
            uTransferFunction.data[tfi + 2] = lerpColor(color[ci - 2], color[ci + 2], koef);
            uTransferFunction.data[tfi + 3] = lerpColor(color[ci - 1], color[ci + 3], koef);

            curDensity += step;
        }

        ci = (density.length - 1) * 4;
        tfi = lastValueIndex;
        uTransferFunction.data[tfi] = color[ci];
        uTransferFunction.data[tfi + 1] = color[ci + 1];
        uTransferFunction.data[tfi + 2] = color[ci + 2];
        uTransferFunction.data[tfi + 3] = color[ci + 3];

        return true;
    }
});
