XML3D.config = XML3D.config || {};

XML3D.config.isXML3DElement = function(e) {
    return (e.nodeType === Node.ELEMENT_NODE && (e.namespaceURI == XML3D.xml3dNS));
};

/**
 * @param {Element} element
 * @param {boolean=} selfmonitoring: whether to register listeners on element for node 
 *                  addition/removal and attribute modification. This property is propagated
 *                  to children. 
 * @return {undefined}
 */
XML3D.config.element = function(element, selfmonitoring) {
    if (element._configured === undefined ) {//&& XML3D.config.isXML3DElement(element)
        var classInfo = XML3D.classInfo[element.localName];
        if (classInfo === undefined) {
            XML3D.debug.logInfo("Unrecognised element " + element.localName);
        } else {
            element._configured = element.localName == "xml3d" ?
                      new XML3D.XML3DHandler(element)
                    : new XML3D.ElementHandler(element,selfmonitoring);
            element._configured.registerAttributes(classInfo);
            // Fix difference in Firefox (undefined) and Chrome (null)
            if (element.style == undefined)
                element.style = null;
            var n = element.firstElementChild;

            XML3D.base.resourceManager.notifyNodeIdChange(element, null, element.getAttribute("id"));

            while(n) {
                XML3D.config.element(n, selfmonitoring);
                n = n.nextElementSibling;
            }
        }
    }
};

/**
 * @param {Element} element
 * @param {boolean=} selfmonitoring: whether to register listeners on element for node 
 *                  addition/removal and attribute modification. This property is propagated
 *                  to children. 
 * @return {undefined}
 */
XML3D.config.configure = function(element, selfmonitoring) {
    if (Array.isArray(element)) {
        Array.forEach(element, function(el) {
            XML3D.config.element(el, selfmonitoring); 
        });
    } else {
        XML3D.config.element(element, selfmonitoring);
    }
};
