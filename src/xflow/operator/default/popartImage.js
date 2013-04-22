// Based on http://kodemongki.blogspot.de/2011/06/kameraku-custom-shader-effects-example.html
Xflow.registerOperator("xflow.popartImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
    params:  [ {type: 'texture', source : 'image'},
        {type: 'float', source : 'time'} ],
    evaluate: function(result, image, time) {
        var width = image.width;
        var height = image.height;

        var s = image.data;
        var d = result.data;
        for (var i = 0; i < s.length; i += 4) {
            var r = s[i] / 255;
            var g = s[i + 1] / 255;
            var b = s[i + 2] / 255;
            var a = s[i + 3] / 255;

            var y = 0.3 * r + 0.59 * g + 0.11 * b;
            y = y < 0.3 ? 0.0 : (y < 0.6 ? 0.5 : 1.0);
            if (y == 0.5) {
                d[i]   = 0.8 * 255;
                d[i+1] = 0;
                d[i+2] = 0;
            } else if (y == 1.0) {
                d[i]   = 0.9 * 255;
                d[i+1] = 0.9 * 255;
                d[i+2] = 0;
            } else {
                d[i] = 0;
                d[i+1] = 0;
                d[i+2] = 0;
            }
            d[i+3] = s[i+3];
        }
        return true;
    }
});
