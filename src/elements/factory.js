// -----------------------------------------------------------------------------
// Class XML3DNodeFactory
// -----------------------------------------------------------------------------
org.xml3d.XML3DNodeFactory = function() {
};

org.xml3d.XML3DNodeFactory.isXML3DNode = function(node) {
    return (node.nodeType === Node.ELEMENT_NODE && (node.namespaceURI == org.xml3d.xml3dNS));
};

org.xml3d.XML3DNodeFactory.prototype.create = function(node, context) {
    var n, t;
    if (org.xml3d.XML3DNodeFactory.isXML3DNode(node)) {
        var classInfo = org.xml3d.classInfo[node.localName];
        if (classInfo === undefined) {
            org.xml3d.debug.logInfo("Unrecognised element " + node.localName);
        } else {
            //classInfo.configure(node, context);
            classInfo(node, context);
            node._configured = true;
            node._classInfo = classInfo;
            //n = new elementType(ctx);
            //node._xml3dNode = n;
            Array.forEach(getElementNodes(node), function(n) {
                return this.create(n, context);
            }, this);
            return n;
        }
    }
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

org.xml3d.XML3DNodeFactory.createBooleanFromString = function(value)
{
    return new Boolean(value);
};

org.xml3d.XML3DNodeFactory.createStringFromString = function(value)
{
    return new String(value);
};

org.xml3d.XML3DNodeFactory.createIntFromString = function(value)
{
    return parseInt(value);
};

org.xml3d.XML3DNodeFactory.createFloatFromString = function(value)
{
    return parseFloat(value);
};

org.xml3d.XML3DNodeFactory.createAnyURIFromString = function(value)
{
    //TODO: not implemented
    return value;
};

org.xml3d.XML3DNodeFactory.createEnumFromString = function(value)
{
    //TODO: not implemented
    return value;
};