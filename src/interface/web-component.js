var XCompProto = Object.create(HTMLElement.prototype);

XCompProto.createdCallback = function() {
    this.root = this.createShadowRoot();
    var clone = document.importNode(this.template.content, true);
    this.root.appendChild(clone);

    this.handlers = {};
    for (var i = 0; i < this.template.attributes.length; i++) {
        var attr = this.template.attributes[i];
        var attrName = attr.localName;
        var place = this.place('.//node()[text()="{{'+attrName+'}}"]');
        if (!place){
            place = this.place('.//@*[.="{{'+attrName+'}}"]');
        }
        if (!place) {
            continue;
        }

        var handler = (function(elem, value) {
            return function (newValue) {
                if (!newValue) newValue = value;
                elem.textContent = newValue;
            };
        })(place, attr.textContent);

        handler(this.getAttribute(attrName));
        this.handlers[attrName] = handler;
    }

    if (this._configured) {
        // This element was already initialized by XML3D before it was properly defined as a web component, we need to trigger a
        // cleanup and re-initialization
        var parent = this.parentElement;
        var nextChild = this.nextElementSibling;
        parent.removeChild(this);
        if (nextChild) {
            parent.insertBefore(this, nextChild);
        } else {
            parent.appendChild(this);
        }
    }

};

XCompProto.place = function (path) {
    var context = this.root.firstElementChild;
    while (context) {
        node = document.evaluate(path, context, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (node) return node;
        context = context.nextElementSibling;
    }
};

XCompProto.attributeChangedCallback = function(attr, oldValue, newValue) {
    var handler = this.handlers[attr];
    if (!handler) return;
    handler(newValue);
};

function registerComponent(source, name) {
    if (typeof source === "string") {
        registerComponentURL(source, name);
    } else if (source instanceof HTMLElement) {
        registerComponentElem(source, name);
    } else {
        XML3D.debug.logError("Must provide a template element or a URL to a template element when registering a component!");
    }
}

function registerComponentURL(url, name) {
    fetch(url).then(function(response) {
        return response.text();
    }).then(function(text) {
        var div = document.createElement("div");
        div.innerHTML = text;
        registerComponentElem(div.querySelector("template"), name);
    }).catch(function(exception) {
        XML3D.debug.logError("Error while registering web component: ", exception);
    });
}

function registerComponentElem(element, name) {
    name = name || element.getAttribute("name");
    var proto = Object.create(XCompProto);
    proto.template = element;
    document.registerElement(name, { prototype: proto });
}

module.exports =  registerComponent;
