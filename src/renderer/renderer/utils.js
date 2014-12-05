/** Calculate the offset of the given element and return it.
 *
 *  @param {Object} element
 *  @return {{top:number, left:number}} the offset
 *
 *  This code is taken from http://javascript.info/tutorial/coordinates .
 *  We don't want to do it with the offsetParent way, because the xml3d
 *  element is actually invisible and thus offsetParent will return null
 *  at least in WebKit. Also it's slow. So we use getBoundingClientRect().
 *  However it returns the box relative to the window, not the document.
 *  Thus, we need to incorporate the scroll factor. And because IE is so
 *  awesome some workarounds have to be done and the code gets complicated.
 */
function calculateOffset(element) {
    var box = element.getBoundingClientRect();
    var body = document.body;
    var docElem = document.documentElement;

    // get scroll factor (every browser except IE supports page offsets)
    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    // the document (`html` or `body`) can be shifted from left-upper corner in IE. Get the shift.
    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;

    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    // for Firefox an additional rounding is sometimes required
    return {top: Math.round(top), left: Math.round(left)};
}


module.exports = {

    /** Convert a given mouse page position to be relative to the given target element.
     *  Most probably the page position are the MouseEvent's pageX and pageY attributes.
     *
     *  @param {!Object} xml3dEl the xml3d element to which the coords need to be translated
     *  @param {!number} pageX the x-coordinate relative to the page
     *  @param {!number} pageY the y-coordinate relative to the page
     *  @return {{x: number, y: number}} the converted coordinates
     */
    convertPageCoords: function (xml3dEl, pageX, pageY) {
        var off = calculateOffset(xml3dEl);

        return {x: pageX - off.left, y: pageY - off.top};
    }
};
