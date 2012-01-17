// -----------------------------------------------------------------------------
// Class XML3DNodeFactory
// -----------------------------------------------------------------------------
org.xml3d.XML3DNodeFactory = function() {
};

org.xml3d.XML3DNodeFactory.isXML3DNode = function(node) {
    return (node.nodeType === Node.ELEMENT_NODE && (node.namespaceURI == org.xml3d.xml3dNS));
};


// TODO: Merge into org.xml3d.configure
org.xml3d.XML3DNodeFactory.prototype.configure = function(element) {
    var n, t;
    if (org.xml3d.XML3DNodeFactory.isXML3DNode(element)) {
        var classInfo = org.xml3d.classInfo[element.localName];
        if (classInfo === undefined) {
            org.xml3d.debug.logInfo("Unrecognised element " + element.localName);
        } else {
            element._configured = new org.xml3d.ElementHandler(element);
            element._configured.registerAttributes(classInfo);
            var n = element.firstElementChild;
            while(n) {
                this.configure(n);
                n = n.nextElementSibling;
            }
            return n;
        }
    }
};

org.xml3d.factory = new org.xml3d.XML3DNodeFactory();
org.xml3d.configure = function(element) {
    if (Array.isArray(element))
    {
        Array.forEach(element, org.xml3d.configure);
    }
    if (element._configured !== undefined)
        return element;
    org.xml3d.factory.configure(element);
};

org.xml3d.XML3DNodeFactory.createXML3DVec3FromString = function(value) {
    var result = new XML3DVec3();
    result.setVec3Value(value);
    return result;
};

org.xml3d.XML3DNodeFactory.createXML3DRotationFromString = function(value) {
    var result = new XML3DRotation();
    result.setAxisAngleValue(value);
    return result;
};

org.xml3d.XML3DNodeFactory.createBooleanFromString = function(value) {
    return new Boolean(value);
};

org.xml3d.XML3DNodeFactory.createStringFromString = function(value) {
    return new String(value);
};

org.xml3d.XML3DNodeFactory.createIntFromString = function(value) {
    return parseInt(value);
};

org.xml3d.XML3DNodeFactory.createFloatFromString = function(value) {
    return parseFloat(value);
};

org.xml3d.XML3DNodeFactory.createAnyURIFromString = function(value) {
    // TODO: not implemented
    return value;
};

org.xml3d.XML3DNodeFactory.createEnumFromString = function(value) {
    // TODO: not implemented
    return value;
};