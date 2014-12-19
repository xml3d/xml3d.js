(function(exports) {
    /**
     * Class URI
     * @constructor
     * @param {string} str The URI as string
     */
    var URI = function (str) {
        str = str || "";
        if (str.indexOf("blob:") == 0) {
            // Based on http://www.w3.org/TR/FileAPI/#url
            var parser = /^(?:([^:\/?\#]+):)?([^\#]*)(?:\#(.*))?/;
            var result = str.match(parser);
            /**  @type {boolean} */
            this.valid = result != null;
            /**  @type {?string} */
            this.scheme = result[1] || null;
            /**  @type {?string} */
            this.authority = null;
            /**  @type {?string} */
            this.path = null;
            /**  @type {?string} */
            this.query = null;
            /**  @type {?string} */
            this.opaqueString = result[2] || null;
            /**  @type {?string} */
            this.fragment = result[3] || null;
        } else {
            // Based on the regex in RFC2396 Appendix B.
            var parser = /^(?:([^:\/?\#]+):)?(?:\/\/([^\/?\#]*))?([^?\#]*)(?:\?([^\#]*))?(?:\#(.*))?/;
            var result = str.match(parser);
            /**  @type {boolean} */
            this.valid = result != null;
            /**  @type {?string} */
            this.scheme = result[1] || null;
            /**  @type {?string} */
            this.authority = result[2] || null;
            /**  @type {?string} */
            this.path = result[3] || null;
            /**  @type {?string} */
            this.query = result[4] || null;
            /**  @type {?string} */
            this.opaqueString = null;
            /**  @type {?string} */
            this.fragment = result[5] || null;
        }
    };

    /**
     * @return {boolean} true if URI is relative to current document
     */
    URI.prototype.isLocal = function () {
        return this.scheme != "blob" && !this.authority && !this.path;
    }

    /**
     * @return {boolean} true if URI is absolute
     */
    URI.prototype.isAbsolute = function () {
        return this.scheme != null;
    }

    /**
     * Get absolute URI relative to the provided document uri
     * @param {string} docUri uri of document from which this uri originates
     * @returns {URI}
     */
    URI.prototype.getAbsoluteURI = function (docUri) {
        if (!this.valid || this.isAbsolute()) {
            return this;
        }

        var docUriObj = new URI(docUri);

        if (this.path) {
            if (this.path.indexOf("/") == 0) {
                docUriObj.path = this.path;
            } else {
                docUriObj.path = docUriObj.path.substr(0, docUriObj.path.lastIndexOf("/") + 1) + this.path;
            }
            docUriObj.query = this.query;
        } else if (this.query) {
            docUriObj.query = this.query;
        }
        docUriObj.fragment = this.fragment;

        return docUriObj;
    }

    /**
     * Returns if this URI has the same origin as the provided reference
     * @param {URI|string} other
     * @returns {boolean}
     */
    URI.prototype.hasSameOrigin = function (other) {
        if (typeof other == 'string')
            other = new URI(other);

        if (this.scheme == "blob" || this.scheme == "data") {
            return true;
        }

        return this.scheme == other.scheme && this.authority == other.authority;
    };


// Restore the URI to it's stringy glory.
    URI.prototype.toString = function () {
        var str = "";
        if (this.scheme == "blob") {
            str = "blob:" + this.opaqueString;
            if (this.fragment) {
                str += "#" + this.fragment;
            }
            return str;
        }
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

// Restore the URI to it's stringy glory minus the fragment
    URI.prototype.toStringWithoutFragment = function () {
        var str = "";
        if (this.scheme == "blob") {
            str = "blob:" + this.opaqueString;
            return str;
        }
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
        return str;
    };

    /**
     * Class URIResolver
     * @constructor
     */
    var URIResolver = function () {
    };

    /**
     * Resolve a local URI to an element
     * @param {(string|URI)} uri Element to resolve
     * @param {Document=} document Base document to use
     * @return {Element} The resolved element or null if it could not be resolved
     */
    URIResolver.resolveLocal = function (uri, document) {
        if (typeof uri == 'string')
            uri = new URI(uri);
        document = document || window.document;

        if (uri.scheme == 'urn' || uri.scheme == "blob") {
            return null;
        }

        if (!uri.path && uri.fragment) { // local uri
            return document.getElementById(uri.fragment);
        }
        return null;
    };


    /**
     * @deprecated
     */
    URIResolver.resolve = function (uri, document) {
        XML3D.debug.logWarning("You are using deprecated XML3D.URIResolver.resolve. Use XML3D.URIResolver.resolveLocal instead.");
        return URIResolver.resolveLocal(uri, document);
    };

    exports.URI = URI;
    exports.URIResolver = URIResolver;

}(module.exports));
