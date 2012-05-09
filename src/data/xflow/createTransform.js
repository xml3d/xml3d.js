XML3D.xflow.register("createTransform", {
    outputs: [{name: 'result', tupleSize: '16'}],
    params:  ['translation','rotation','scale','center','scaleOrientation'],
    evaluate: function(translation,rotation,scale,center,scaleOrientation) {
        rotation = rotation.data ? rotation.data[0].getValue() : rotation;
        var count = translation ? translation.length / 3 :
                    rotation ? rotation.length / 4 :
                    scale ? scale.length / 3 :
                    center ? center.length / 3 :
                    scaleOrientation ? scaleOrientation / 4 : 0;
        if(!count)
            throw ("createTransform: No input found");
        this.result = this.result || new Float32Array(count*16);
        for(var i = 0; i < count; i++) {
            mat4.makeTransformOffset(translation,rotation,scale,center,scaleOrientation,i,this.result);
        }
        return true;
    }
});