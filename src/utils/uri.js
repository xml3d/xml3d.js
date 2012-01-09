// -----------------------------------------------------------------------------
// Class URI
// -----------------------------------------------------------------------------
org.xml3d.URI = function(str) {
    if (!str)
        str = "";
    // Based on the regex in RFC2396 Appendix B.
    var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
    var result = str.match(parser);
    this.scheme = result[1] || null;
    this.authority = result[2] || null;
    this.path = result[3] || null;
    this.query = result[4] || null;
    this.fragment = result[5] || null;
};

// Restore the URI to it's stringy glory.
org.xml3d.URI.prototype.toString = function() {
    var str = "";
    if (this.scheme) {
        str += this.scheme + ":";
    }
    if (this.authority) {
        str += "//" + this.authority;
    }
    if (this.path) {
        str += this.path;
    }
    if (this.query) {
        str += "?" + this.query;
    }
    if (this.fragment) {
        str += "#" + this.fragment;
    }
    return str;
};

// -----------------------------------------------------------------------------
// Class URIResolver
// -----------------------------------------------------------------------------
org.xml3d.URIResolver = function() {
};

org.xml3d.URIResolver.resolve = function(document, uriStr) {
    if (!document || !uriStr)
        return null;
    var uri = new org.xml3d.URI(uriStr);

    if (uri.scheme == 'urn')
    {
        org.xml3d.debug.logInfo("++ Found URN." + uriStr);
        return null;
    }

    if (!uri.path)
        return org.xml3d.URIResolver.resolveLocal(document, uri.fragment);


    org.xml3d.debug.logWarning("++ Can't resolve global hrefs yet: " + uriStr);
    // TODO Resolve intra-document references
    return null;
};

org.xml3d.URIResolver.resolveLocal = function(document, id) {
    if (document !== undefined && document) {
        var elem = document.getElementById(id);
        //org.xml3d.debug.logInfo("++ Found: " + elem);
        if (elem)
        {
            var node = document.getNode(elem);
            //org.xml3d.debug.logInfo("++ Found: " + node);
            return node;
        }
    }
    return null;
};
