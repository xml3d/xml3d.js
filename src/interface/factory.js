// -----------------------------------------------------------------------------
// Class XML3DNodeFactory
// -----------------------------------------------------------------------------
xml3d.XML3DNodeFactory = function() {
};

xml3d.XML3DNodeFactory.isXML3DNode = function(node) {
    return (node.nodeType === Node.ELEMENT_NODE && (node.namespaceURI == xml3d.xml3dNS));
};


// TODO: Merge into xml3d.configure
xml3d.XML3DNodeFactory.prototype.configure = function(element) {
    if (xml3d.XML3DNodeFactory.isXML3DNode(element)) {
        var classInfo = xml3d.classInfo[element.localName];
        if (classInfo === undefined) {
            xml3d.debug.logInfo("Unrecognised element " + element.localName);
        } else {
            element._configured = element.localName == "xml3d" ?
                      new xml3d.XML3DHandler(element)
                    : new xml3d.ElementHandler(element);
            element._configured.registerAttributes(classInfo);
            // Fix difference in Firefox (undefined) and Chrome (null)
            if (element.style == undefined)
                element.style = null;
            var n = element.firstElementChild;
            while(n) {
                this.configure(n);
                n = n.nextElementSibling;
            }
            return n;
        }
    }
};

xml3d.factory = new xml3d.XML3DNodeFactory();
xml3d.configure = function(element) {
    if (Array.isArray(element))
    {
        Array.forEach(element, xml3d.configure);
    }
    if (element._configured !== undefined)
        return element;
    xml3d.factory.configure(element);
};

xml3d.XML3DNodeFactory.createXML3DVec3FromString = function(value) {
    var result = new XML3DVec3();
    result.setVec3Value(value);
    return result;
};

xml3d.XML3DNodeFactory.createXML3DRotationFromString = function(value) {
    var result = new XML3DRotation();
    result.setAxisAngleValue(value);
    return result;
};

xml3d.XML3DNodeFactory.createBooleanFromString = function(value) {
    return new Boolean(value);
};

xml3d.XML3DNodeFactory.createStringFromString = function(value) {
    return new String(value);
};

xml3d.XML3DNodeFactory.createIntFromString = function(value) {
    return parseInt(value);
};

xml3d.XML3DNodeFactory.createFloatFromString = function(value) {
    return parseFloat(value);
};

xml3d.XML3DNodeFactory.createAnyURIFromString = function(value) {
    // TODO: not implemented
    return value;
};

xml3d.XML3DNodeFactory.createEnumFromString = function(value) {
    // TODO: not implemented
    return value;
};