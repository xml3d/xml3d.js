Xflow.registerOperator("xflow.flipVerticalImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
    params:  [ {type: 'texture', source : 'image'} ],
    evaluate: function(result, image) {
        var width = image.width;
        var height = image.height;

        var destpix = result.data;
        var srcpix = image.data;

        for (var y = 0; y < height; ++y) {
            for (var x = 0; x < width; ++x) {
                var rowOffset = y * width;
                var srcOffset = (rowOffset + x) * 4;
                var dstOffset = (rowOffset + ((width-1) - x)) * 4;
                destpix[dstOffset] =  srcpix[srcOffset];
                destpix[dstOffset+1] = srcpix[srcOffset+1];
                destpix[dstOffset+2] = srcpix[srcOffset+2];
                destpix[dstOffset+3] = srcpix[srcOffset+3];
            }
        }
        return true;
    }
});
