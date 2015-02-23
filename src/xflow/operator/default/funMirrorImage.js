// Based on: http://web.archive.org/web/20100310063925/http://dem.ocracy.org/libero/photobooth/

Xflow.registerOperator("xflow.funMirrorImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
    params:  [ {type: 'texture', source : 'image'},
               {type: 'float', source : 'time'} ],
    evaluate: function(result, image, time) {
        var width = result.width;
        var height = result.height;
        var time = time[0];

        var s = image.data;
        var d = result.data;

        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {

                /*original coordinates*/
                // [0.0 ,1.0] x [0.0, 1.0]
                var coordX = x / width;
                var coordY = y / height;

                // [-1.0 ,1.0] x [-1.0, 1.0]
                var normCoordX = 2.0 * coordX - 1.0;
                var normCoordY = 2.0 * coordY - 1.0;

                /*go to polar coordinates*/
                var r = Math.sqrt(normCoordX*normCoordX + normCoordY*normCoordY); // length(normCoord)
                var phi = Math.atan2(normCoordY, normCoordX);

                /*squeeze and vary it over time*/
                r = Math.pow(r, 1.0/1.8) * time;

                /*back to cartesian coordinates*/
                normCoordX = r * Math.cos(phi);
                normCoordY = r * Math.sin(phi);
                // [0.0 ,1.0] x [0.0, 1.0]
                coordX = normCoordX / 2.0 + 0.5;
                coordY = normCoordY / 2.0 + 0.5;

                var sX = Math.round(coordX * width);
                var sY = Math.round(coordY * height);

                var i = (sY * width + sX)*4;
                var r = s[i];
                var g = s[i + 1];
                var b = s[i + 2];
                var a = s[i + 3];

                /*color the fragment with calculated texture*/
                var i = (y * width + x)*4;
                d[i] = r;
                d[i + 1] = g;
                d[i + 2] = b;
                d[i + 3] = a;
            }
        }
        return true;
    }
});
