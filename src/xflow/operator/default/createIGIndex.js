Xflow.registerOperator("xflow.createIGIndex", {
    outputs:[
        //{type:'int', name:'index', customAlloc:true },
        {type:'float2', name:'texcoord', customAlloc:true }
    ],
    params:[
        {type:'int', source:'vertexCount', optional:false},
        {type:'texture', source:'positionTex', optional: false}
    ],
    alloc:function (sizes, vertexCount, image) {
        sizes['texcoord'] = image.width * image.height;
        //sizes['index'] = vertexCount[0];
    },
    evaluate:function (texcoord, vertexCount, image, info) {
        // tex coords
        var halfPixel = {
            x: 0.5 / image.width,
            y: 0.5 / image.height
        };
        var i = 0;
        for (var y = 0, ylength = image.height; y < ylength; y++)
        {
            for (var x = 0, xlength = image.width; x < xlength; x++)
            {
                texcoord[i++] = (x / xlength) + halfPixel.x;
                texcoord[i++] = 1 - ((y / ylength) + halfPixel.y);
            }
        }

        // index creation
        /*for(var i = 0; i < vertexCount[0]; i++) {
            index[i] = i;
        }*/
        return true;
    }
});
