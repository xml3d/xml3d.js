var Xflow = require("../operator.js");

Xflow.registerOperator("xflow.sepiaImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
    params:  [ {type: 'texture', source : 'image'} ],
    evaluate: function(result, image) {
        var s = image.data;
        var d = result.data;
        var r = 0, g = 0, b = 0;
        for(var i = 0 ; i < s.length; i += 4) {
            r = (s[i] * 0.393 + s[i+1] * 0.769 + s[i+2] * 0.189);
            g = (s[i] * 0.349 + s[i+1] * 0.686 + s[i+2] * 0.168);
            b = (s[i] * 0.272 + s[i+1] * 0.534 + s[i+2] * 0.131);
            if (r>255) r = 255;
            if (g>255) g = 255;
            if (b>255) b = 255;
            if (r<0) r = 0;
            if (g<0) g = 0;
            if (b<0) b = 0;
            d[i] = r;
            d[i+1] = g;
            d[i+2] = b;
            d[i+3] = 255;
        }
        return true;
    },
    evaluate_parallel: function(index, image){
        var x = index[0], y = index[1];
        var r = (image[x][y][0] * 0.393 + image[x][y][1] * 0.769 + image[x][y][2] * 0.189);
        var g = (image[x][y][0] * 0.349 + image[x][y][1] * 0.686 + image[x][y][2] * 0.168);
        var b = (image[x][y][0] * 0.272 + image[x][y][1] * 0.534 + image[x][y][2] * 0.131);
        if (r>255) r = 255;
        if (g>255) g = 255;
        if (b>255) b = 255;
        if (r<0) r = 0;
        if (g<0) g = 0;
        if (b<0) b = 0;
        return [r,g,b,255];
    }
});
