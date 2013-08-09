(function(webgl){

    var createBuffer = function(gl, type) {
        var buffer = gl.createBuffer();
        gl.bindBuffer(type, buffer);
        return buffer;
    }

    var GLBuffer = function(context, type) {
        this.context = context;
        this.type = type;
        this.buffer = createBuffer(context.gl, type);
    };

    XML3D.extend(GLBuffer.prototype, {
        setData: function(data) {
            var gl = this.context.gl;
            gl.bindBuffer(this.type, this.buffer);
            gl.bufferData(this.type, data, gl.STATIC_DRAW);
            this.length = data.length;
            this.glType = getGLTypeFromArray(data);
        }
    })



}(XML3D.webgl));