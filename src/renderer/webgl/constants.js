
// 01.10.2015: Workaround for Safari bug on iOS 9 (https://bugs.webkit.org/show_bug.cgi?id=148449)
module.exports = WebGLRenderingContext.ONE ? WebGLRenderingContext : WebGLRenderingContext.prototype;