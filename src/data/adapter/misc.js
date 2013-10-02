// data/sink.js
(function() {
    "use strict";

    /**
     * SinkDataAdapter represents the sink in the data hierarchy (no parents).
     * Class XML3D.data.SinkDataAdapter
     * @constructor
     * @extends {XML3D.data.DataAdapter}
     * @param factory
     * @param node
     */
    var SinkDataAdapter = function(factory, node) {
        XML3D.data.DataAdapter.call(this, factory, node);
    };
    XML3D.createClass(SinkDataAdapter, XML3D.data.DataAdapter);

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

    // Export
    XML3D.data.SinkDataAdapter = SinkDataAdapter;



    var ScriptDataAdapter = function(factory, node) {
        XML3D.base.NodeAdapter.call(this, factory, node);
    };
    XML3D.createClass(ScriptDataAdapter, XML3D.base.NodeAdapter);
    XML3D.data.ScriptDataAdapter = ScriptDataAdapter;

    ScriptDataAdapter.prototype.getScriptType = function(){
        return this.node.type;
    }

    ScriptDataAdapter.prototype.getScriptCode = function(){
        return this.node.innerText;
    }

    ScriptDataAdapter.prototype.notifyChanged = function(evt) {
        switch(evt.type){
            case XML3D.events.VALUE_MODIFIED:
            case XML3D.events.NODE_INSERTED:
            case XML3D.events.NODE_REMOVED: this.notifyOppositeAdapters();
        }
    };

    var ImgDataAdapter = function(factory, node) {
        XML3D.base.NodeAdapter.call(this, factory, node);
        this.textureEntry = null;
        this.image = null;
        if (node.src)
            this.createImageFromURL(node.src);
    };
    XML3D.createClass(ImgDataAdapter, XML3D.base.NodeAdapter);

    /**
     * Creates a new image object
     *
     * @param {string} url
     */
    ImgDataAdapter.prototype.createImageFromURL = function(url) {
        var that = this;
        var uri = new XML3D.URI(url).getAbsoluteURI(this.node.ownerDocument.documentURI);
        var onload = function (e, image) {
            if (that.textureEntry) {
                that.textureEntry.setImage(image);
            }
        };
        var onerror = function (e, image) {
            XML3D.debug.logError("Could not load image URI="+image.src);
        };
        this.image = XML3D.base.resourceManager.getImage(uri, onload, onerror);
    };

    /**
     * @param {Xflow.TextureEntry} entry
     */
    ImgDataAdapter.prototype.setTextureEntry = function(entry) {
        this.textureEntry = entry;
        if (this.image) {
            this.textureEntry.setImage(this.image);
        }
    };

    ImgDataAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.VALUE_MODIFIED) {
            var attr = evt.wrapped.attrName;
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
        XML3D.data.DataAdapter.call(this, factory, node);
        this.textureEntry = null;
        this.video = null;
        this._ticking = false;
        this._boundTick = this._tick.bind(this);
        if (node.src)
            this.createVideoFromURL(node.src);
    };
    XML3D.createClass(VideoDataAdapter, XML3D.base.NodeAdapter);

    /**
     * Creates a new video object
     *
     * @param {string} url
     */
    VideoDataAdapter.prototype.createVideoFromURL = function(url) {
        var that = this;
        var uri = new XML3D.URI(url).getAbsoluteURI(this.node.ownerDocument.documentURI);
        this.video = XML3D.base.resourceManager.getVideo(uri, this.node.autoplay,
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
            this.textureEntry.setImage(this.video);
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
            this.textureEntry.setImage(this.video);
        }
    };

    VideoDataAdapter.prototype.notifyChanged = function(evt) {
        if (evt.type == XML3D.events.VALUE_MODIFIED) {
            var attr = evt.wrapped.attrName;
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

    /** IFrameDataAdapter **/

     var IFrameDataAdapter = function(factory, node) {
        XML3D.base.NodeAdapter.call(this, factory, node);
        this.textureEntry = null;
        this.image = null;
        this.createImageFromIFrame(node);
    };
    XML3D.createClass(IFrameDataAdapter, XML3D.base.NodeAdapter);

    /**
     * Creates a new iframe object
     *
     * @param {string} url
     */
    IFrameDataAdapter.prototype.createImageFromIFrame = function(node) {
        var canvas = document.createElement("canvas");
        canvas.width = node.getAttribute("width");
        canvas.height = node.getAttribute("height");
        canvas.complete = false;
        // canvas.addEventListener("mousemove",mouseMoved,false);
        // canvas.addEventListener("mousedown",click, false);
        document.body.appendChild(canvas);

        var newIFrame = document.createElement("iframe");
        newIFrame.id = "newIFrame";
        newIFrame.setAttribute("scrolling", "no");
        newIFrame.width = node.getAttribute("width");
        newIFrame.height = node.getAttribute("height");
        newIFrame.style.position = "absolute";
        newIFrame.style.left = (-newIFrame.width - 8) + "px";
        document.body.appendChild(newIFrame);

        newIFrame.addEventListener("load", function() {
            fireEvent();
        }, true);
        newIFrame.src = node.src;

        var that = this;

        function fireEvent() {
            var data = {
                _iframe : newIFrame,
                _canvas : canvas
            };
            var evt = document.createEvent("CustomEvent");
            evt.initCustomEvent("XML3D_XML3DINIT", true, false, data);
            document.dispatchEvent(evt);

            data._canvas.complete = true;
            if (that.textureEntry) {
                that.textureEntry.setImage(canvas);
            }
        }
        ;

        // function mouseMoved () {
        // console.log("mouse moved!");
        // };

        // function click () {
        // console.log("click!");
        // }

        this.image = canvas;
    };

    /**
     * @param {Xflow.TextureEntry} entry
     */
    IFrameDataAdapter.prototype.setTextureEntry = function(entry) {
        this.textureEntry = entry;
        if (this.image) {
            this.textureEntry.setImage(this.image);
        }
    };

    // Export
    XML3D.data.IFrameDataAdapter = IFrameDataAdapter;
    XML3D.data.ImgDataAdapter = ImgDataAdapter;
    XML3D.data.VideoDataAdapter = VideoDataAdapter;

}());