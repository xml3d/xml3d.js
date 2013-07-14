(function(webgl){

    var ShaderInfo = function(scene, opt) {
        opt = opt || {};
        this.data = opt.data;
        this.script = opt.script;
        this.scene.shaderInfos.push(this);
    };

    XML3D.extend(ShaderInfo.prototype, {
        setScript: function(script) {
            if(this.script != script) {
                this.script = script;
                this.scriptChangedEvent();
            }
        },
        scriptChangedEvent: function() {

        }
    });

    webgl.ShaderInfo = ShaderInfo;

}(XML3D.webgl));