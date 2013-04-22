// Basic pixel-wise operations
Xflow.registerOperator("xflip.grayscale", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var s = input.data;
        var d = output.data;
        for (var i = 0; i < s.length; i += 4) {
			// CIE luminance        (HSI Intensity: Averaging three channels)
			d[i] = d[i + 1] = d[i + 2] = 0.2126 * s[i] + 0.7152 * s[i + 1] + 0.0722 * s[i + 2];
            d[i + 3] = s[i + 3];
        }
        return true;
    }
});

Xflow.registerOperator("xflip.complement", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var s = input.data;
        var d = output.data;

        for (var i = 0; i < s.length; i += 4) {
            d[i] = 255 - s[i];
            d[i + 1] = 255 - s[i + 1];
            d[i + 2] = 255 - s[i + 2];
            d[i + 3] = s[i + 3];
        }

        return true;
    }
});

Xflow.registerOperator("xflip.dim", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
			   {type: 'float', source : 'ratio'}],
    evaluate: function(output, input, ratio) {
        if (ratio[0] < 0)
            throw "Invalid ratio: ratio must be positive"

        var s = input.data;
        var d = output.data;

        for (var i = 0; i < s.length; i += 4) {
            d[i] = ratio[0] * s[i];
            d[i + 1] = ratio[0] * s[i + 1];
            d[i + 2] = ratio[0] * s[i + 2];
            d[i + 3] = s[i + 3];
        }

        return true;
    }
});

Xflow.registerOperator("xflip.threshold", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
			   {type: 'int', source : 'threshold'}],
    evaluate: function(output, input, threshold) {
        if (threshold[0] < 0 || threshold[0] > 255)
            throw "Invalid threshold: threshold value must be between 0 and 255"

        var s = input.data;
        var d = output.data;

        for (var i = 0; i < s.length; i += 4) {
            d[i] = d[i + 1] = d[i + 2] = ((s[i] >= threshold[0]) ? 255 : 0);
            d[i + 3] = s[i + 3];
        }

        return true;
    }
});

function euclideanDist(point1, point2) {
    var sum = 0;

    for (var i = 0; i < point1.length; i++)
        sum += Math.pow(point1[i] - point2[i], 2);

    return Math.sqrt(sum);
}

Xflow.registerOperator("xflip.sliceColor", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
               {type: 'int', source : 'color'},
               {type: 'float', source : 'radius'} ],
    evaluate: function(output, input, color, radius) {
        if (color.length != 3)
            throw "Invalid color: color must have 3 integer channels";

        if (radius[0] < 0)
            throw "Invalid radius: radius must be a positive real number";

        var s = input.data;
        var d = output.data;

        for (var i = 0; i < s.length; i += 4) {
            if (euclideanDist([s[i], s[i + 1], s[i + 2]], color) < radius[0]) {
                d[i] = s[i];
                d[i + 1] = s[i + 1];
                d[i + 2] = s[i + 2];
            } else
                d[i] = d[i + 1] = d[i + 2] = 255;

            d[i + 3] = s[i + 3];
        }

        return true;
    }
});

Xflow.registerOperator("xflip.createSaturateMatrix", {
    outputs: [ {type: 'float', name : 'output', customAlloc: true} ],
    params:  [ {type: 'float', source : 'weight'} ],
    alloc: function(sizes) {
        sizes['output'] = 16;
    },
    evaluate: function(output, weight) {
        var v = weight[0];
        XML3D.math.mat4.identity(output);
        output[0] = 0.213 + 0.787 * v;
        output[1] = 0.715 - 0.715 * v;
        output[2] = 0.072 - 0.072 * v;
        output[4] = 0.213 - 0.213 * v;
        output[5] = 0.715 + 0.285 * v;
        output[6] = 0.072 - 0.072 * v;
        output[8] = 0.213 - 0.213 * v;
        output[9] = 0.715 - 0.715 * v;
        output[10] = 0.072 + 0.928 * v;
    }
});

Xflow.registerOperator("xflip.mulColorMatrix", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
               {type: 'float', source : 'weights'} ],
    evaluate: function(output, input, weights) {
        if (weights.length != 16)
            throw "Weights matrix must be 4 by 4";

        var s = input.data;
        var d = output.data;
        var newColor = XML3D.math.vec4.create();
        for (var i = 0; i < s.length; i += 4) {
            var oldColor = [s[i], s[i + 1], s[i + 2], s[i + 3]];
            XML3D.math.vec4.transformMat4(newColor, oldColor, weights);
            d[i] = newColor[0];
            d[i + 1] = newColor[1];
            d[i + 2] = newColor[2];
            d[i + 3] = newColor[3];
        }

        return true;
    }
});

Xflow.registerOperator("xflip.mask", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
               {type: 'texture', source : 'input2'},
               {type: 'float', source : 'weight'} ],
    evaluate: function (output, input1, input2, weight) {
        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;
        var v = weight[0];

        for (var i = 0; i < s1.length; i += 4) {
            d[i] = s1[i] + v * s2[i];
            d[i + 1] = s1[i + 1] + v * s2[i + 1];
            d[i + 2] = s1[i + 2] + v * s2[i + 2];
            d[i + 3] = 255;
        }

        return true;
    }
});

Xflow.registerOperator("xflip.getChannelMagnitude", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
               {type: 'texture', source : 'input2'} ],
    evaluate: function (output, input1, input2) {
        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;

        for (var i = 0; i < s1.length; i += 4) {
            d[i] = Math.sqrt(Math.pow(s1[i], 2) + Math.pow(s2[i], 2));
            d[i + 1] = Math.sqrt(Math.pow(s1[i + 1], 2) + Math.pow(s2[i + 1], 2));
            d[i + 2] = Math.sqrt(Math.pow(s1[i + 2], 2) + Math.pow(s2[i + 2], 2));
            d[i + 3] = 255;
        }

        return true;
    }
});

Xflow.registerOperator("xflip.premultiply", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var s = input.data;
        var d = output.data;

        for (var i = 0; i < s.length; i += 4) {
            var r = 255 / s[i + 3];
            d[i] = s[i] / r;
            d[i + 1] = s[i + 1] / r;
            d[i + 2] = s[i + 2] / r;
            d[i + 3] = s[i + 3];
        }

        return true;
    }
});

Xflow.registerOperator("xflip.unpremultiply", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var s = input.data;
        var d = output.data;

        for (var i = 0; i < s.length; i += 4) {
            var r = 255 / s[i + 3];
            d[i] = s[i] * r
            d[i + 1] = s[i + 1] * r;
            d[i + 2] = s[i + 2] * r;
            d[i + 3] = s[i + 3];
        }

        return true;
    }
});

// Blending
Xflow.registerOperator("xflip.blendNormal", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
        {type: 'texture', source : 'input2'}],
    evaluate: function (output, input1, input2) {
        if (!(input1.width == input2.width && input1.height == input2.height))
            throw "Input images must be of the same size";

        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;
        var r1, r2, r3;

        for (var i = 0; i < s1.length; i += 4) {
            r1 = s1[i + 3] / 255;
            r2 = s2[i + 3] / 255;
            r3 = 1 - (1 - r1) * (1 - r2);
            d[i] = r3 * ((1 - r1) * s2[i] * r2 + s1[i] * r1);
            d[i + 1] = r3 * ((1 - r1) * s2[i + 1] * r2 + s1[i + 1] * r1);
            d[i + 2] = r3 * ((1 - r1) * s2[i + 2] * r2 + s1[i + 2] * r1);
            d[i + 3] = r3 * 256;
        }

        return true;
    }
});

Xflow.registerOperator("xflip.blendMultiply", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
        {type: 'texture', source : 'input2'}],
    evaluate: function (output, input1, input2) {
        if (!(input1.width == input2.width && input1.height == input2.height))
            throw "Input images must be of the same size";

        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;
        var r1, r2, r3;

        for (var i = 0; i < s1.length; i += 4) {
            r1 = s1[i + 3] / 255;
            r2 = s2[i + 3] / 255;
            r3 = 1 - (1 - r1) * (1 - r2);
            d[i] = 255 * r3 * ((1 - r1) * s2[i] / 255 * r2 + (1 - r2) * s1[i] / 255 * r1 +
                s1[i] / 255 * r1 * s2[i] / 255 * r2);
            d[i + 1] = 255 * r3 * ((1 - r1) * s2[i + 1] / 255 * r2 + (1 - r2) * s1[i + 1] / 255 * r1 +
                s1[i + 1] / 255 * r1 * s2[i + 1] / 255 * r2);
            d[i + 2] = 255 * r3 * ((1 - r1) * s2[i + 2] / 255 * r2 + (1 - r2) * s1[i + 2] / 255 * r1 +
                s1[i + 2] / 255 * r1 * s2[i + 2] / 255 * r2);
            d[i + 3] = 255 * r3;
        }

        return true;
    }
});

Xflow.registerOperator("xflip.blendScreen", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
               {type: 'texture', source : 'input2'} ],
    evaluate: function (output, input1, input2) {
        if (!(input1.width == input2.width && input1.height == input2.height))
            throw "Input images must be of the same size";

        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;
        var r1, r2, r3;

        for (var i = 0; i < s1.length; i += 4) {
            r1 = s1[i + 3] / 255;
            r2 = s2[i + 3] / 255;
            r3 = 1 - (1 - r1) * (1 - r2);
            d[i] = 255 * r3 * (s1[i] / 255 * r1 + s2[i] / 255 * r2 - s1[i] / 255 * r1 * s2[i] / 255 * r2);
            d[i + 1] = 255 * r3 * (s1[i + 1] / 255 * r1 + s2[i + 1] / 255 * r2 - s1[i + 1] / 255 * r1 * s2[i + 1] / 255 * r2);
            d[i + 2] = 255 * r3 * (s1[i + 2] / 255 * r1 + s2[i + 2] / 255 * r2 - s1[i + 2] / 255 * r1 * s2[i + 2] / 255 * r2);
            d[i + 3] = 255 * r3;
        }

        return true;
    }
});

Xflow.registerOperator("xflip.blendDarken", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
        {type: 'texture', source : 'input2'}],
    evaluate: function (output, input1, input2) {
        if (!(input1.width == input2.width && input1.height == input2.height))
            throw "Input images must be of the same size";

        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;
        var r1, r2, r3;

        for (var i = 0; i < s1.length; i += 4) {
            r1 = s1[i + 3] / 255;
            r2 = s2[i + 3] / 255;
            r3 = 1 - (1 - r1) * (1 - r2);
            d[i] = r3 * Math.min((1 - r1) * s2[i] * r2 + s1[i] * r1, (1 - r2) * s1[i] * r1 + s2[i] * r2);
            d[i + 1] = r3 * Math.min((1 - r1) * s2[i + 1] * r2 + s1[i + 1] * r1, (1 - r2) * s1[i + 1] * r1 + s2[i + 1] * r2);
            d[i + 2] = r3 * Math.min((1 - r1) * s2[i + 2] * r2 + s1[i + 2] * r1, (1 - r2) * s1[i + 2] * r1 + s2[i + 2] * r2);
            d[i + 3] = r3 * 255;
        }

        return true;
    }
});

Xflow.registerOperator("xflip.blendLighten", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input1'} ],
    params:  [ {type: 'texture', source : 'input1'},
        {type: 'texture', source : 'input2'}],
    evaluate: function (output, input1, input2) {
        if (!(input1.width == input2.width && input1.height == input2.height))
            throw "Input images must be of the same size";

        var s1 = input1.data;
        var s2 = input2.data;
        var d = output.data;
        var r1, r2, r3;

        for (var i = 0; i < s1.length; i += 4) {
            r1 = s1[i + 3] / 255;
            r2 = s2[i + 3] / 255;
            r3 = 1 - (1 - r1) * (1 - r2);
            d[i] = r3 * Math.max((1 - r1) * s2[i] * r2 + s1[i] * r1, (1 - r2) * s1[i] * r1 + s2[i] * r2);
            d[i + 1] = r3 * Math.max((1 - r1) * s2[i + 1] * r2 + s1[i + 1] * r1, (1 - r2) * s1[i + 1] * r1 + s2[i + 1] * r2);
            d[i + 2] = r3 * Math.max((1 - r1) * s2[i + 2] * r2 + s1[i + 2] * r1, (1 - r2) * s1[i + 2] * r1 + s2[i + 2] * r2);
            d[i + 3] = r3 * 255;
        }

        return true;
    }
});

// Spatial filtering
Xflow.registerOperator("xflip.convolve", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input', 'formatType' : 'float32'} ],
    params:  [ {type: 'texture', source : 'input'},
			   {type: 'float', source : 'filter'}],
    evaluate: function(output, input, filter) {
        var filterSide = Math.sqrt(filter.length);		// width/height of the square filter

        if(parseFloat(filterSide) != parseInt(filterSide) || isNaN(filterSide))
            throw "Invalid filter: filter is not square";
        else if (filterSide % 2 == 0)
            throw "Invalid filter: the side of the square filter is not odd";

        var width = input.width;
        var height = input.height;
        var s = input.data;
        var d = output.data;

        var len = Math.floor(filterSide / 2);			// half of the side of the square filter

        for (var j = 0; j < height; j++)
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                d[offset] = d[offset + 1] = d[offset + 2] = 0;
                d[offset + 3] = s[offset + 3];
                for (var l = -len; l <= len; l++)
                    for (var k = -len; k <= len; k++)
                        if (j + l >= 0 && j + l < height && i + k >= 0 && i + k < width) {
                            var neighborOffset = ((j + l) * width + (k + i)) * 4;
                            var filterOffset = (l + len) * filterSide + (k + len);
                            d[offset] += s[neighborOffset] * filter[filterOffset];
                            d[offset + 1] += s[neighborOffset + 1] * filter[filterOffset];
                            d[offset + 2] += s[neighborOffset + 2] * filter[filterOffset];
                        }
            }

        return true;
    }
});

function gaussian(x, y, sigma) {
	return Math.pow(Math.E, -(Math.pow(x, 2) + Math.pow(y, 2)) / (2 * Math.pow(sigma, 2)));
}

Xflow.registerOperator("xflip.createGaussianFilter", {
    outputs: [ {type: 'float', name : 'output', customAlloc: true} ],
    params:  [ {type: 'int', source : 'size'},
			   {type: 'float', source : 'sigma'} ],
    alloc: function(sizes, size) {
        sizes['output'] = size[0] * size[0];
    },
    evaluate: function(output, size, sigma) {
        if (size[0] % 2 == 0)
            throw "Invalid size: size must be an odd integer";

        if (sigma[0] < 0)
            throw "Invalid sigma: sigma must be a positive real number";

		var len = Math.floor(size[0] / 2);

		var sum = 0;
		for (var j = -len; j <= len; j++)
			for (var i = -len; i <= len; i++) {
				var offset = (j + len) * size[0] + (i + len);
				output[offset] = gaussian(i, j, sigma[0]);
				sum += output[offset];
			}

		for (var i = 0; i < output.length; i++)
            output[i] /= sum;

        return true;
    }
});

Xflow.registerOperator("xflip.createAveragingFilter", {
    outputs: [ {type: 'float', name : 'output', customAlloc: true} ],
    params:  [ {type: 'int', source : 'size'} ],
    alloc: function(sizes, size) {
        sizes['output'] = size[0] * size[0];
    },
    evaluate: function(output, size) {
        if (size[0] % 2 == 0)
            throw "Invalid size: size must be an odd integer";

        for (var i = 0; i < output.length; i++)
            output[i] = 1 / output.length;
    }
});

Xflow.registerOperator("xflip.median", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
                {type: 'int', source : 'size'}],
    evaluate: function(output, input, size) {
        var filterSide = size[0];	// width/height of the square filter
        if (filterSide % 2 == 0)
            throw "Invalid size: size must be an odd integer";

        var width = input.width;
        var height = input.height;
        var s = input.data;
        var d = output.data;

        for (var j = 0; j < height; j++)
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                var neighborsR = new Array();
                var neighborsG = new Array();
                var neighborsB = new Array();
                var len = Math.floor(filterSide / 2);
                for (var l = -len; l <= len; l++)
                    for (var k = -len; k <= len; k++)
                        if (j + l >= 0 && j + l < height && i + k >= 0 && i + k < width) {
                            var neighborOffset = ((j + l) * width + (k + i)) * 4;
                            neighborsR.push(s[neighborOffset]);
                            neighborsG.push(s[neighborOffset + 1]);
                            neighborsB.push(s[neighborOffset + 2]);
                        }
                neighborsR.sort(function(a, b) {return a - b});
                neighborsB.sort(function(a, b) {return a - b});
                neighborsG.sort(function(a, b) {return a - b});
                d[offset] = neighborsR[Math.floor(neighborsR.length / 2)];
                d[offset + 1] = neighborsG[Math.floor(neighborsG.length / 2)];
                d[offset + 2] = neighborsB[Math.floor(neighborsB.length / 2)];
                d[offset + 3] = s[offset + 3];
            }

        return true;
    }
});

// Morphology
Xflow.registerOperator("xflip.erode", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
			   {type: 'int', source : 'filter'}],
    evaluate: function(output, input, filter) {
        var filterSide = Math.sqrt(filter.length);		// width/height of the square filter

        if(parseFloat(filterSide) != parseInt(filterSide) || isNaN(filterSide))
            throw "Invalid filter: filter is not square";
        else if (filterSide % 2 == 0)
            throw "Invalid filter: the side of the square filter is not odd";

        var width = input.width;
        var height = input.height;
        var s = input.data;
        var d = output.data;

        var len = Math.floor(filterSide / 2);			// half of the width/height of the square filter

        for (var j = 0; j < height; j++)
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                var minR = 255, minG = 255, minB = 255, minA = 255;
                for (var l = -len; l <= len; l++)
                    for (var k = -len; k <= len; k++)
                        if (j + l >= 0 && j + l < height && i + k >= 0 && i + k < width) {
                            var neighborOffset = ((j + l) * width + (k + i)) * 4;
                            var filterOffset = (l + len) * filterSide + (k + len);
                            minR = (filter[filterOffset] == 1) ? Math.min(minR, s[neighborOffset]) : minR;
                            minG = (filter[filterOffset] == 1) ? Math.min(minG, s[neighborOffset + 1]) : minG;
                            minB = (filter[filterOffset] == 1) ? Math.min(minB, s[neighborOffset + 2]) : minB;
                            minA = (filter[filterOffset] == 1) ? Math.min(minA, s[neighborOffset + 3]) : minA;
                        }
                d[offset] = minR;
                d[offset + 1] = minG;
                d[offset + 2] = minB;
                d[offset + 3] = minA;
            }

        return true;
}
});

Xflow.registerOperator("xflip.dilate", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
			   {type: 'int', source : 'filter'}],
    evaluate: function(output, input, filter) {
        var filterSide = Math.sqrt(filter.length);		// width/height of the square filter

        if(parseFloat(filterSide) != parseInt(filterSide) || isNaN(filterSide))
            throw "Invalid filter: filter is not square";
        else if (filterSide % 2 == 0)
            throw "Invalid filter: the side of the square filter is not odd";

        var width = input.width;
        var height = input.height;
        var s = input.data;
        var d = output.data;

        var len = Math.floor(filterSide / 2);			// half of the width/height of the square filter

        for (var j = 0; j < height; j++)
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                var maxR = 0, maxG = 0, maxB = 0, maxA = 0;
                for (var l = -len; l <= len; l++)
                    for (var k = -len; k <= len; k++)
                        if (j + l >= 0 && j + l < height && i + k >= 0 && i + k < width) {
                            var neighborOffset = ((j + l) * width + (k + i)) * 4;
                            filterOffset = (l + len) * filterSide + (k + len);
                            maxR = (filter[filterOffset] == 1) ? Math.max(maxR, s[neighborOffset]) : maxR;
                            maxG = (filter[filterOffset] == 1) ? Math.max(maxG, s[neighborOffset + 1]) : maxG;
                            maxB = (filter[filterOffset] == 1) ? Math.max(maxB, s[neighborOffset + 2]) : maxB;
                            maxA = (filter[filterOffset] == 1) ? Math.max(maxA, s[neighborOffset + 3]) : maxA;
                        }
                d[offset] = maxR;
                d[offset + 1] = maxG;
                d[offset + 2] = maxB;
                d[offset + 3] = maxA;
            }

        return true;
}
});

Xflow.registerOperator("xflip.createSquareMorphologyFilter", {
    outputs: [ {type: 'int', name : 'output', customAlloc: true} ],
    params:  [ {type: 'int', source : 'size'} ],
    alloc: function(sizes, size) {
        sizes['output'] = size[0] * size[0];
    },
    evaluate: function(output, size) {
        if (size[0] % 2 == 0)
            throw "Invalid size: size must be an odd integer";

        for (var i = 0; i < output.length; i++)
            output[i] = 1;
    }
});

// Histogram processing
Xflow.registerOperator("xflip.createHistogram", {
    outputs: [ {type: 'float', name : 'histogram', customAlloc: true} ],
    params:  [ {type: 'texture', source : 'input'},
               {type: 'int', source : 'channel'} ],
    alloc: function(sizes, input) {
        sizes['histogram'] = 256;
    },
    evaluate: function(histogram, input, channel) {
        if (channel[0] < 0 || channel[0] > 2)
            throw "Invalid channel: channel must be 0, 1 or 2";
        var s = input.data;
        // reset histogram to 0
        for (var i = 0; i < histogram.length; ++i)
            histogram[i] = 0;
        // compute histogram
        for (var i = 0; i < s.length; i += 4)
            histogram[s[i + channel[0]]]++;
        // normalize histogram
        for (var i = 0; i < histogram.length; i++)
            histogram[i] /= (input.width * input.height);
    }
});

Xflow.registerOperator("xflip.createEqualizationHST", {
    outputs: [ {type: 'float', name : 'HST'} ],
    params:  [ {type: 'float', source : 'histogram'} ],
    evaluate: function(HST, histogram) {
        for (var i = 0; i < HST.length; i++)
            for (var j = 0; j <= i; j++)
                HST[i] = HST[i] + histogram[j];

        for (var i = 0; i < HST.length; i++)
            HST[i] = 255 * HST[i];
    }
});

Xflow.registerOperator("xflip.applyHST", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
               {type: 'float', source: 'HST'},
               {type: 'int', source: 'channel'}],
    evaluate: function(output, input, HST, channel) {
        if (channel[0] < 0 || channel[0] > 2)
            throw "Invalid channel: channel must be 0, 1 or 2";

        var s = input.data;
        var d = output.data;
        for (var i = 0; i < s.length; i += 4) {
            d[i] = s[i];
            d[i + 1] = s[i + 1];
            d[i + 2] = s[i + 2];
            d[i + channel[0]] = HST[s[i + channel[0]]];
            d[i + 3] = s[i + 3];
        }
    }
});

Xflow.registerOperator("xflip.applyGrayscaleHST", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'},
               {type: 'float', source: 'HST'} ],
    evaluate: function(output, input, HST) {
        var s = input.data;
        var d = output.data;
        for (var i = 0; i < s.length; i += 4) {
            d[i] = d[i + 1] = d[i + 2] = HST[s[i]];
            d[i + 3] = s[i + 3];
        }
    }
});

// Padding and cropping
/*
* Pads both sides of the input image to the nearest powers of 2
*/
Xflow.registerOperator("xflip.padToPow2", {
    outputs: [ {type: 'texture', name : 'output', customAlloc: true},
               {type: 'int', name: 'originalSize', customAlloc: true} ],
    params:  [ {type: 'texture', source : 'input'} ],
    alloc: function(sizes, input) {
        var paddedWidth = 1, paddedHeight = 1;
        while ((paddedWidth *= 2) < input.width);
        while ((paddedHeight *= 2) < input.height);
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        sizes['output'] = {
            imageFormat : {width: paddedWidth, height: paddedHeight, type: 'float32'},
            samplerConfig : samplerConfig
        };
        sizes['originalSize'] = 2;
    },
    evaluate: function(output, originalSize, input) {
        originalSize[0] = input.width;
        originalSize[1] = input.height;
        var s = input.data;
        var d = output.data;

        for (var i = 0; i < d.length; i += 4) {
            d[i] = d[i + 1] = d[i + 2] = 0;
            d[i + 3] = 255;
        }

        for (var j = 0; j < input.height; j++)
            for (var i = 0; i < input.width; i++) {
                var sourceOffset = (j * input.width + i) * 4;
                var destOffset = (j * output.width + i) * 4;
                d[destOffset] = s[sourceOffset];
                d[destOffset + 1] = s[sourceOffset + 1];
                d[destOffset + 2] = s[sourceOffset + 2];
                d[destOffset + 3] = s[sourceOffset + 3];
            }
    }
});

/*
* Returns the area of interest of an input image
*/
Xflow.registerOperator("xflip.crop", {
    outputs: [ {type: 'texture', name : 'output', customAlloc: true} ],
    params:  [ {type: 'texture', source : 'input'},
               {type: 'int', source : 'origin', array: true},
               {type: 'int', source : 'size', array: true} ],
    alloc: function(sizes, input, origin, size) {
        var samplerConfig = new Xflow.SamplerConfig;
        samplerConfig.setDefaults();
        sizes['output'] = {
            imageFormat : {width: size[0], height: size[1]},
            samplerConfig : samplerConfig
        };
    },
    evaluate: function(output, input, origin, size) {
        if (!(origin[0] >= 0 && origin[0] <= input.width && origin[1] >= 0 && origin[1] <= input.height))
            throw "Invalid crop origin: origin must be inside the image";

        if (!(size[0] >= 0 && size[0] <= input.width - origin[0] &&
              size[1] >= 0 && size[1] <= input.height - origin[1]))
            throw "Invalid crop size";

        var s = input.data;
        var d = output.data;
        for (var j = 0; j < output.height; j++)
            for (var i = 0; i < output.width; i++) {
                var sourceOffset = ((j + origin[1]) * input.width + (i + origin[0])) * 4;
                var destOffset = (j * output.width + i) * 4;
                d[destOffset] = s[sourceOffset];
                d[destOffset + 1] = s[sourceOffset + 1];
                d[destOffset + 2] = s[sourceOffset + 2];
                d[destOffset + 3] = s[sourceOffset + 3];
            }
    }
});

// Frequency domain
/*
 2D Discrete Fourier Transform (DFT) with REAL input
 Amplitude and Phase are stored in the first and the second component of the output texture, respectively.
 */
Xflow.registerOperator("xflip.applyDFT", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input', 'formatType' : 'float32'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var width = input.width;
        var height = input.height;
        var d = output.data;
        for (var v = 0; v < height; v++)
            for (var u = 0; u < width; u++) {   // for every pixel (u, v) in the output image
                var destOffset = (v * width + u) * 4;
                d[destOffset] = 0;
                d[destOffset + 1] = 0;
                for (var y = 0; y < height; y++)
                    for (var x = 0; x < width; x++) {
                        var sourceOffset = (y * width + x) * 4;
                        var arg = 2 * Math.PI * (u * x / width + v * y / height);
                        var R = input.data[sourceOffset] * Math.pow(-1, x + y); // centering
                        d[destOffset] += R * Math.cos(arg);
                        d[destOffset + 1] += - R * Math.sin(arg);
                    }
            }

        for (var i = 0; i < d.length; i += 4) {
            d[i] /= (width * height);
            d[i + 1] /= (width * height);
        }

        return true;
    }
});

/*
 2D Inverse Discrete Fourier Transform (IDFT) with COMPLEX input
 Amplitude and Phase are stored in the first and the second component of the output texture, respectively.
 */
Xflow.registerOperator("xflip.applyDFTInv", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input', 'formatType' : 'float32'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var width = input.width;
        var height = input.height;
        var d = output.data;
        for (var v = 0; v < height; v++)
            for (var u = 0; u < width; u++) {   // for every pixel (u, v) in the output image
                var destOffset = (v * width + u) * 4;
                d[destOffset] = 0;
                d[destOffset + 1] = 0;
                for (var y = 0; y < height; y++)
                    for (var x = 0; x < width; x++) {
                        var sourceOffset = (y * width + x) * 4;
                        var arg = 2 * Math.PI * (u * x / width + v * y / height);
                        var R = input.data[sourceOffset];
                        var I = input.data[sourceOffset + 1];
                        d[destOffset] += R * Math.cos(arg) - I * Math.sin(arg);
                        d[destOffset + 1] += I * Math.cos(arg) + R * Math.sin(arg);
                    }
            }

        for (var j = 0; j < height; j++)
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                d[offset] *=  Math.pow(-1, i + j); // centering
                d[offset + 1] = d[offset + 2] = d[offset];
                d[offset + 3] = 255;
            }
    }
});

/*
* Computes in-place radix-2 Cooley-Tukey FFT on a row / column of an input image
* Computations are performed in-place
* Parameter dir determines the forward (1) or inverse (-1) transform
* Parameter rc determines weather the operation to be performed on WHth row (0) / column (1)
* General idea is taken from Paul Bourke 1D- & 2D-FFT implementation (Jul 1998)
*/
function FFT1D(dir, image, rc, wh) {
    var size = (rc == 0) ? image.width : image.height;

    var side = 0;
    var temp = size;
    while ((temp /= 2) >= 1) side++;

    var sd = image.data;
    var width = image.width;

    // Bit reversal
    var j = 0;
    for (var i = 0; i < size - 1; i++) {
        if (i < j) {
            var offsetI, offsetJ;
            if (rc == 0) {      // offset in the original image depends on if we are dealing with a row or a column
                offsetI = (wh * width + i) * 4;
                offsetJ = (wh * width + j) * 4;
            }
            else {
                offsetI = (i * width + wh) * 4;
                offsetJ = (j * width + wh) * 4;
            }

            // swapping the Ith element with the Jth element
            var tx = sd[offsetI];
            var ty = sd[offsetI + 1];
            sd[offsetI] = sd[offsetJ];
            sd[offsetI + 1] = sd[offsetJ + 1];
            sd[offsetJ] = tx;
            sd[offsetJ + 1] = ty;
        }

        var k = size / 2;
        while (k <= j) {
            j -= k;
            k /= 2;
        }
        j += k;
    }

    // FFT computation
    var c1 = -1.0;
    var c2 = 0.0;
    var l2 = 1;
    for (var l = 0; l < side; l++) {
        var l1 = l2;
        l2 *= 2;
        var u1 = 1;
        var u2 = 0;
        for (var j = 0; j < l1; j++) {
            for (var i = j; i < size; i += l2) {
                var i1 = i + l1;

                var offsetI, offsetI1;
                if (rc == 0) {
                    offsetI = (wh * width + i) * 4;
                    offsetI1 = (wh * width + i1) * 4;
                }
                else {
                    offsetI = (i * width + wh) * 4;
                    offsetI1 = (i1 * width + wh) * 4;
                }

                var t1 = u1 * sd[offsetI1] - u2 * sd[offsetI1 + 1];
                var t2 = u1 * sd[offsetI1 + 1] + u2 * sd[offsetI1];
                sd[offsetI1] = sd[offsetI] - t1;
                sd[offsetI1 + 1] = sd[offsetI + 1] - t2;
                sd[offsetI] += t1;
                sd[offsetI + 1] += t2;
            }
            var z =  u1 * c1 - u2 * c2;
            u2 = u1 * c2 + u2 * c1;
            u1 = z;
        }

        if (dir == 1)
            c2 = - Math.sqrt((1 - c1) / 2);
        else
            c2 = Math.sqrt((1 - c1) / 2);

        c1 = Math.sqrt((1 + c1) / 2);
    }
}

/*
 2D Fast Fourier Transform (FFT) with REAL input
 Amplitude and Phase are stored in the first and the second component of the output texture, respectively.
 */
Xflow.registerOperator("xflip.applyFFT", {
    outputs: [ {type: 'texture', name : 'output', 'formatType' : 'float32', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var s = input.data;
        var width = input.width;
        var height = input.height;
        var d = output.data;

        if (Math.log(width)/Math.log(2) != Math.floor(Math.log(width)/Math.log(2)) ||
            Math.log(height)/Math.log(2) != Math.floor(Math.log(height)/Math.log(2)))
            throw "Invalid input picture: width and height of the input image must be of power of 2"

        // Row Transformations
        for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                d[offset] = s[offset] * Math.pow(-1, i + j);        // centering is applied here
                d[offset + 1] = 0;      // input image is real
            }
            FFT1D(1, output, 0, j);
        }

        // Column Transformations
        for (var i = 0; i < width; i++)
            FFT1D(1, output, 1, i);

        // Scaling
        for (var i = 0; i < d.length; i += 4) {
            d[i] /= (width * height);
            d[i + 1] /= (width * height);
        }

        return true;
    }
});

/*
 2D Inverse Fast Fourier Transform (IFFT) with COMPLEX input
 Amplitude and Phase are stored in the first and the second component of the output texture, respectively.
 */
Xflow.registerOperator("xflip.applyFFTInv", {
    outputs: [ {type: 'texture', name : 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source : 'input'} ],
    evaluate: function(output, input) {
        var width = input.width;
        var height = input.height;
        var s = input.data;
        var d = output.data;

        if (Math.log(width)/Math.log(2) != Math.floor(Math.log(width)/Math.log(2)) ||
            Math.log(height)/Math.log(2) != Math.floor(Math.log(height)/Math.log(2)))
            throw "Invalid input picture: width and height of the input image must be of power of 2"

        // Row Transformations
        for (var j = 0; j < height; j++) {
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                d[offset] = s[offset];
                d[offset + 1] = s[offset + 1];
            }
            FFT1D(-1, output, 0, j);
        }

        // Column Transformations
        for (var i = 0; i < width; i++)
            FFT1D(-1, output, 1, i);

        // Centering and presentation
        for (var j = 0; j < height; j++)
            for (var i = 0; i < width; i++) {
                var offset = (j * width + i) * 4;
                d[offset] = d[offset + 1] = d[offset + 2] = d[offset] * Math.pow(-1, i + j);
                d[offset + 3] = 255;
            }
    }
});

/*
 * Draws spectrum of a Fourier transform
 * First and second channels of input texture are the amplitude and the phase of the transform, respectively.
 * Input of this operator is of Float32 precision
 */
Xflow.registerOperator("xflip.createSpectrumImage", {
    outputs: [ {type: 'texture', name: 'output', sizeof: 'input'} ],
    params:  [ {type: 'texture', source: 'input', 'formatType' : 'float32'} ],
    evaluate: function (output, input) {
        var s = input.data;
        var d = output.data;
        for (var i = 0; i < d.length; i += 4) {
            var temp = Math.sqrt(Math.pow(s[i], 2) + Math.pow(s[i + 1], 2));
            d[i] = d[i + 1] = d[i + 2] = 1000 * Math.log(1 + temp) / Math.LN10;
            d[i + 3] = 255;
        }
    }
});

Xflow.registerOperator("xflip.applyGaussianLPF", {
    outputs: [ {type: 'texture', name: 'output', sizeof: 'input', 'formatType' : 'float32'} ],
    params:  [ {type: 'texture', source: 'input'},
               {type: 'float', source: 'sigma'} ],
    evaluate: function (output, input, sigma) {
        if (sigma[0] < 0)
            throw "Invalid sigma: sigma must be a positive real number";

        var d = output.data;

        for (var j = 0; j < input.height; j++)
            for (var i = 0; i < input.width; i++) {
                var offset = (j * input.width + i) * 4;
                var v = gaussian(i - input.width / 2, j - input.height / 2, sigma[0]);
                d[offset] = input.data[offset] * v;
                d[offset + 1] = input.data[offset + 1] * v;
            }
    }
});

Xflow.registerOperator("xflip.applyGaussianHPF", {
    outputs: [ {type: 'texture', name: 'output', sizeof: 'input', 'formatType' : 'float32'} ],
    params:  [ {type: 'texture', source: 'input'},
        {type: 'float', source: 'sigma'} ],
    evaluate: function (output, input, sigma) {
        if (sigma[0] < 0)
            throw "Invalid sigma: sigma must be a positive real number";

        var d = output.data;

        for (var j = 0; j < input.height; j++)
            for (var i = 0; i < input.width; i++) {
                var offset = (j * input.width + i) * 4;
                var v = 1 - gaussian(i - input.width / 2, j - input.height / 2, sigma[0]);
                d[offset] = input.data[offset] * v;
                d[offset + 1] = input.data[offset + 1] * v;
            }
    }
});