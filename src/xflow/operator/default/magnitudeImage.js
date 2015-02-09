var Xflow = require("../operator.js");

Xflow.registerOperator("xflow.magnitudeImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image1'} ],
    params:  [
        {type: 'texture', source : 'image1'},
        {type: 'texture', source : 'image2'}
    ],
    evaluate: function(result, image1, image2) {
        var inpix1 = image1.data;
        var inpix2 = image2.data;
        var outpix = result.data;

        var len = inpix1.length;
        for (var i = 0 ; i < len; i+=1) {
            var val1 = inpix1[i];
            var val2 = inpix2[i];
            outpix[i] = Math.sqrt(val1*val1 + val2*val2);
        }
        return true;
    }
});
