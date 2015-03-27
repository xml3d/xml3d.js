Xflow.registerOperator("xflow.volumeDataFromPNG", {
    outputs: [{type: 'ubyte', name: 'volumeNumericData', customAlloc: true}],
    params: [{type: 'texture', source: 'slice'}],
    mapping: [{source: 'slice', sequence: Xflow.SEQUENCE.ARRAY, array: true}],

    alloc: function (sizes, slice) {

        var pseudoAllocate = false;

        for (var z = 0; z < slice.length; z++) {
            if (slice[z]._loading) {
                pseudoAllocate = true;
                break;
            }
        }

        if (pseudoAllocate) {
            // console.log("pseudo allocate");
            sizes["volumeNumericData"] = 0;
        } else {
            // console.log("allocate array for volume data");
            sizes["volumeNumericData"] = slice.length * slice[0].width * slice[0].height;
        }

    },

    evaluate: function (volumeNumericData, slice) {

        if (volumeNumericData.length == 0)
            return false;

        console.log("evaluate: images uploaded... ");

        var size_x = slice[0].width;
        var size_y = slice[0].height;
        var size_z = slice.length;

        var i, x, y, z, offset;
        var canvas = document.createElement('canvas');
        canvas.width = size_x;
        canvas.height = size_y;
        var ctx = canvas.getContext('2d');
        var imageData;

        for (z = 0; z < size_z; z++) {
            if (slice[z]._image) {
                ctx.drawImage(slice[z]._image, 0, 0);
                imageData = ctx.getImageData(0, 0, size_x, size_y).data;

                if (imageData) {
                    i = 1; // get G channel from png image // TODO: needs discussion
                    offset = size_x * size_y * z;

                    for (y = 0; y < size_y; y++) {
                        for (x = 0; x < size_x; x++) {
                            volumeNumericData[offset++] = imageData[i];
                            i += 4;
                        }
                    }
                }
            }
        }
        return true;
    }
});
