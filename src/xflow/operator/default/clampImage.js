var Xflow = require("../operator.js");

Xflow.registerOperator("xflow.clampImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image', formatType: 'ImageData'} ],
    params:  [ {type: 'texture', source : 'image'},
               {type: 'float', source : 'min'},
               {type: 'float', source : 'max'}
             ],
    evaluate: function(result, image, min, max) {
        var inpix = image.data;
        var outpix = result.data;
        var minv = min[0];
        var maxv = max[0];
        var len = image.data.length;
        for (var i = 0 ; i < len; i++) {
            var val = inpix[i];
            if (val < minv) val = minv;
            if (val > maxv) val = maxv;
            outpix[i] = val;
        }
        return true;
    }
});
