var DataAdapter = require("./data.js");
var createClass = XML3D.createClass;
var NodeAdapter = XML3D.base.NodeAdapter;
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
    createClass(SinkDataAdapter, DataAdapter);

    /**
     * Indicates whether this DataAdapter is a SinkAdapter (has no parent
     * DataAdapter).
     *
     * @returns true if this DataAdapter is a SinkAdapter, otherwise false.
     */
    SinkDataAdapter.prototype.isSinkAdapter = function() {
        return true;
    };

    /**
     * Returns String representation of this DataAdapter
     */
    SinkDataAdapter.prototype.toString = function() {
        return "XML3D.data.SinkDataAdapter";
    };


    var ImgDataAdapter = function(factory, node) {
        NodeAdapter.call(this, factory, node);
        this.textureEntry = null;
        this.image = null;
        if (node.src)
            this.createImageFromURL(node.src);
    };
    createClass(ImgDataAdapter, NodeAdapter);

    /**
     * Creates a new image object
     *
     * @param {string} url
     */
    ImgDataAdapter.prototype.createImageFromURL = function(url) {
        var that = this;
        var uri = new XML3D.URI(url).getAbsoluteURI(this.node.ownerDocument._documentURL || this.node.ownerDocument.URL);
        var onload = function (e, image) {
            if (that.textureEntry) {
                that.textureEntry.setImage(image, true);
            }
        };
        var onerror = function (e, image) {
            XML3D.debug.logError("Could not load image URI="+image.src);
        };
        this.image = XML3D.base.resourceManager.getImage(uri, onload, onerror);
        if (that.textureEntry) {
            that.textureEntry.setImage(this.image, true);
        }
    };

    /**
     * @param {Xflow.TextureEntry} entry
     */
    ImgDataAdapter.prototype.setTextureEntry = function(entry) {
        this.textureEntry = entry;
        if (this.image) {
            this.textureEntry.setImage(this.image, true);
        }
    };

    ImgDataAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.VALUE_MODIFIED) {
            var attr = evt.mutation.attributeName;
            if(attr == "src"){
                this.createImageFromURL(this.node.src);
            }
        };
    };

    ImgDataAdapter.prototype.getValue = function(cb, obj) {
        return this.image;
    };

    ImgDataAdapter.prototype.getOutputs = function() {
        var result = {};
        result['image'] = this;
        return result;
    };

    ImgDataAdapter.prototype.resolveScript = function() {
        return null;
    };

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
        var uri = new XML3D.URI(url).getAbsoluteURI(this.node.ownerDocument._documentURL || this.node.ownerDocument.URL);
        this.video = XML3D.base.resourceManager.getVideo(uri, this.node.autoplay, this.node.loop,
            {
                canplay : function(event, video) {
                    XML3D.util.dispatchCustomEvent(that.node, 'canplay', true, true, null);
                    that._startVideoRefresh();
                },
                ended : function(event, video) {
                    XML3D.util.dispatchCustomEvent(that.node, 'ended', true, true, null);
                },
                load : function(event, video) {
                    XML3D.util.dispatchEvent(that.node, 'load');
                },
                error : function(event, video) {
                    XML3D.util.dispatchCustomEvent(that.node, 'error', true, true, null);
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
        window.requestAnimFrame(this._boundTick, XML3D.webgl.MAXFPS);
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
        if (evt.type == XML3D.events.VALUE_MODIFIED) {
            var attr = evt.mutation.attributeName;
            if(attr == "src"){
                this.createVideoFromURL(this.node.src);
            }
        };
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

