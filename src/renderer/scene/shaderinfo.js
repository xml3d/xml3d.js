(function(webgl){

    var getUniqueId = (function(){
        var c_counter = 0;
        return function() {
              return c_counter++;
        }
    }());

    /**
     * @param {XML3D.webgl.Scene} scene
     * @param {Object} opt
     * @constructor
     */
    var ShaderInfo = function(scene, opt) {
        opt = opt || {};
        this.id = getUniqueId();
        this.scene = scene;
        this.data = opt.data;
        /** @type XML3D.URI */
        this.script = opt.script;
        this.scene.shaderInfos.push(this);
        this.node = null;
        this.changeListener = [];
    };

    XML3D.extend(ShaderInfo.prototype, {
        /**
         * @param {XML3D.URI} script
         */
        setScript: function(script) {
            if(this.script != script) {
                this.script = script;
                if(script.scheme == "urn") {
                    this.node = null;
                } else {
                    // TODO: This should be done via resourceManager, but script node is not yet
                    // configured
                    if (script.isLocal()) {
                        this.node = XML3D.URIResolver.resolveLocal(script);
                        if(!this.node){
                            XML3D.debug.logError("Could not resolve script for shader: " + script.toString());
                        }
                    }
                }

                this.scriptChangedEvent();
            }
        },
        /**
         * @returns {XML3D.URI}
         */
        getScript: function() {
            return this.script;
        },
        getData: function() {
            return this.data;
        },
        addChangeListener: function(listener){
            this.changeListener.push(listener);
        },

        scriptChangedEvent: function() {
            for(var i = 0; i < this.changeListener.length; ++i){
                this.changeListener[i](this);
            }
        }
    });

    webgl.ShaderInfo = ShaderInfo;

}(XML3D.webgl));
