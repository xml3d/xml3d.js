(function(){


XML3D.css = {};

XML3D.css.TRANSFORM_PROPERTY = null;

XML3D.css.init = function(){
    if('transform' in document.body.style)
        XML3D.css.TRANSFORM_PROPERTY = 'transform'
    else if('WebkitTransform' in document.body.style)
        XML3D.css.TRANSFORM_PROPERTY = '-webkit-transform'
    else if('MozTransform' in document.body.style)
        XML3D.css.TRANSFORM_PROPERTY = '-moz-transform'
    else
        XML3D.debug.logWarning("No supported transform css property found");

}

XML3D.css.getInlinePropertyValue = function(node, property)
{
    var styleValue = node.getAttribute('style');
    if(styleValue) {
        var pattern    = new RegExp( property + "\s*:([^;]+)", "i");
        var result = pattern.exec(styleValue);
        if(result)
            return result[1].trim();
    }
    return null;
}

XML3D.css.getPropertyValue = function(node, property)
{
    var value = this.getInlinePropertyValue(node, property);
    if(value)
        return value;

    var style = window.getComputedStyle(node);
    return style.getPropertyValue(property);
}

XML3D.css.getCSSMatrix = function(node){
    if(!XML3D.css.TRANSFORM_PROPERTY || !XML3D.css.CSSMatrix)
        return null;

    var style = null;

    if(XML3D.css.TRANSFORM_PROPERTY != "transform")
        style = XML3D.css.getInlinePropertyValue(node, "transform");

    if(!style)
        style = XML3D.css.getPropertyValue(node, XML3D.css.TRANSFORM_PROPERTY);

    if(!style || style == "none")
        return null;

    var result = null;
    try{
        result = new XML3D.css.CSSMatrix(style);
    }
    catch(e){
        XML3D.debug.logError("Error parsing transform property: " + style);
    }
    return result;

}




}());