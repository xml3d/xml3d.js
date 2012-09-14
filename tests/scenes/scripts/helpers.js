window.getPixelValue = function(canvas, x,y) {
    var pixels = new Uint8Array(4), a = new Array(4);
    canvas.readPixels(x, y, 1, 1, WebGLRenderingContext.RGBA, WebGLRenderingContext.UNSIGNED_BYTE, pixels);
    for(var i=0;i<4;i++)
        a[i] = pixels[i];
    return a;
};
