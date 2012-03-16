xml3d.config = xml3d.config || {};

xml3d.config.isXML3DElement = function(e) {
    return (e.nodeType === Node.ELEMENT_NODE && (e.namespaceURI == xml3d.xml3dNS));
};

xml3d.config.element = function(element, selfmonitoring) {
    if (element._configured === undefined && xml3d.config.isXML3DElement(element)) {
        var classInfo = xml3d.classInfo[element.localName];
        if (classInfo === undefined) {
            xml3d.debug.logInfo("Unrecognised element " + element.localName);
        } else {
            element._configured = element.localName == "xml3d" ?
                      new xml3d.XML3DHandler(element)
                    : new xml3d.ElementHandler(element,selfmonitoring);
            element._configured.registerAttributes(classInfo);
            // Fix difference in Firefox (undefined) and Chrome (null)
            if (element.style == undefined)
                element.style = null;
            var n = element.firstElementChild;
            while(n) {
                xml3d.config.element(n);
                n = n.nextElementSibling;
            }
            return n;
        }
    }
};

xml3d.config.configure = function(element, selfmonitoring) {
    if (Array.isArray(element))
    {
        Array.forEach(element, xml3d.config.element);
    }
    xml3d.config.element(element, selfmonitoring);
};
