Xflow.registerOperator("xflow.grayscaleImage", {
    outputs: [ {type: 'texture', name : 'result', sizeof : 'image'} ],
    params:  [ {type: 'texture', source : 'image'} ],
    evaluate: function(result, image) {
        var width = image.width;
        var height = image.height;

        var s = image.data;
        var d = result.data;
        for (var i = 0; i < s.length; i += 4) {
            var r = s[i];
            var g = s[i + 1];
            var b = s[i + 2];
            var a = s[i + 3];
            // CIE luminance for the RGB
            // The human eye is bad at seeing red and blue, so we de-emphasize them.
            var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            d[i] = d[i + 1] = d[i + 2] = v
            d[i + 3] = a;
        }
        return true;
    }
});
