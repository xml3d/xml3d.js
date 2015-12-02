var DataAdapter = require("./data.js");
var Events = require("../../interface/notification.js");
var URI = require("../../utils/uri.js").URI;
var Util = require("../../utils/misc.js");
var Resource = require("../../resource/coordinator.js");

var NodeAdapter = require("../../base/adapter.js").NodeAdapter;
var createClass = XML3D.createClass;

/**
 * SinkDataAdapter represents the sink in the data hierarchy (no parents).
 * @constructor
 * @extends {DataAdapter}
 * @param factory
 * @param node
 */
var SinkDataAdapter = function(factory, node) {
    DataAdapter.call(this, factory, node);
};
createClass(SinkDataAdapter, DataAdapter, {

    /**
     * Indicates whether this DataAdapter is a SinkAdapter (has no parent
     * DataAdapter).
     *
     * @returns true if this DataAdapter is a SinkAdapter, otherwise false.
     */
    isSinkAdapter: function () {
        return true;
    },

    /**
     * Returns String representation of this DataAdapter
     */
    toString: function () {
        return "XML3D.data.SinkDataAdapter";
    }
});


    var ImgDataAdapter = function(factory, node) {
        NodeAdapter.call(this, factory, node);
        this.textureEntry = null;
        this.image = null;
        if (node.src)
            this.createImageFromURL(node.src);
    };
    createClass(ImgDataAdapter, NodeAdapter, {

        /**
         * Creates a new image object
         *
         * @param {string} url
         */
        createImageFromURL: function (url) {
            var that = this;
            var uri = new URI(url).getAbsoluteURI(this.node.ownerDocument._documentURL || this.node.ownerDocument.URL);
            var onload = function (e, image) {
                if (that.textureEntry) {
                    that.textureEntry.setImage(image, true);
                }
            };
            var onerror = function (e, image) {
                XML3D.debug.logError("Could not load image URI=" + image.src);
            };
            this.image = Resource.getImage(uri, onload, onerror);
            if (that.textureEntry) {
                that.textureEntry.setImage(this.image, true);
            }
        },

        /**
         * @param {Xflow.TextureEntry} entry
         */
        setTextureEntry: function (entry) {
            this.textureEntry = entry;
            if (this.image) {
                this.textureEntry.setImage(this.image, true);
            }
        },

        attributeChangedCallback: function (name, oldValue, newValue) {
            if (name == "src") {
                this.createImageFromURL(newValue);
            }
        },

        notifyChanged: function (evt) {
        },

        getValue: function (cb, obj) {
            return this.image;
        },

        getOutputs: function () {
            var result = {};
            result['image'] = this;
            return result;
        },

        resolveScript: function () {
            return null;
        }
    });

    var VideoDataAdapter = function(factory, node) {
        DataAdapter.call(this, factory, node);
        this.textureEntry = null;
        this.video = null;
        this._ticking = false;
        this._boundTick = this._tick.bind(this);
        if (node.src)
            this.createVideoFromURL(node.src);
    };
    createClass(VideoDataAdapter, NodeAdapter);

    /**
     * Creates a new video object
     *
     * @param {string} url
     */
    VideoDataAdapter.prototype.createVideoFromURL = function(url) {
        var that = this;
        var uri = new URI(url).getAbsoluteURI(this.node.ownerDocument._documentURL || this.node.ownerDocument.URL);
        this.video = Resource.getVideo(uri, this.node.autoplay, this.node.loop, this.node.muted,
            {
                canplay : function(event, video) {
                    Util.dispatchCustomEvent(that.node, 'canplay', true, true, null);
                    that._startVideoRefresh();
                },
                ended : function(event, video) {
                    Util.dispatchCustomEvent(that.node, 'ended', true, true, null);
                },
                load : function(event, video) {
                    Util.dispatchEvent(that.node, 'load');
                },
                error : function(event, video) {
                    Util.dispatchCustomEvent(that.node, 'error', true, true, null);
                    XML3D.debug.logError("Could not load video URI="+video.src);
                }
            }
        );
        if (this.textureEntry)
            this.textureEntry.setImage(this.video, true);
    };

    VideoDataAdapter.prototype.play = function() {
        if (this.video)
            this.video.play();
    };

    VideoDataAdapter.prototype.pause = function() {
        if (this.video)
            this.video.pause();
    };

    VideoDataAdapter.prototype._startVideoRefresh = function() {
        if (!this._ticking)
            this._tick();
    };

    VideoDataAdapter.prototype._tick = function() {
        this._ticking = true;
        window.requestAnimationFrame(this._boundTick);
        // FIXME Do this only when currentTime is changed (what about webcam ?)
        if (this.textureEntry) {
            this.textureEntry.setImage(this.video);
        }
    };

    /**
     * @param {Xflow.TextureEntry} entry
     */
    VideoDataAdapter.prototype.setTextureEntry = function(entry) {
        this.textureEntry = entry;
        if (this.video) {
            this.textureEntry.setImage(this.video, true);
        }
    };

    VideoDataAdapter.prototype.notifyChanged = function(evt) {
    };

    VideoDataAdapter.prototype.attributeChangedCallback = function (name, oldValue, newValue) {
        if (name == "src") {
            this.createVideoFromURL(newValue);
        }
    };

    VideoDataAdapter.prototype.getValue = function(cb, obj) {
        return this.video;
    };

    VideoDataAdapter.prototype.getOutputs = function() {
        var result = {};
        result['video'] = this;
        return result;
    };

    // Export
    module.exports = {
        ImgDataAdapter: ImgDataAdapter,
        VideoDataAdapter: VideoDataAdapter,
        SinkDataAdapter: SinkDataAdapter
    };

