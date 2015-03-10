function LightManager() {
    this._lights = [];
    this._models = {};

    /**
     * Updating light parameters can lead to updating the (lazy) scene structure, which
     * in turn updates the lights. If we are in updating the lights, flag is set to true.
     * @type {boolean}
     * @private
     */
    this._inUpdate = false;
}

LightManager.prototype = {
    add: function (light) {
        this._lights.push(light);
        this._addModel(light.model);
    },

    remove: function (light) {
        var index = this._lights.indexOf(light);
        if (index != -1) {
            this._lights.splice(index, 1);
        }
        this._removeModel(light.model);
    },

    fillGlobalParameters: function (globals, force) {
        for (var id in this._models) {
            var entry = this._models[id];
            /* Fill globals only if this was not already done before */
            if (entry.changed || force) {
                var prefix = id + "Light";
                for (var param in entry.parameters) {
                    var name = prefix + param.charAt(0).toUpperCase() + param.slice(1);
                    globals[name] = entry.parameters[param];
                }
                entry.changed = false;
            }
        }
    },

    lightValueChanged: function (light) {
        if (this._inUpdate)
            return;


        this._inUpdate = true;
        var model = light.model;
        var entry = this.getModelEntry(model.id);
        var offset = entry.lightModels.indexOf(model);
        XML3D.debug.assert(offset != -1, "Light values changed for a light that is not managed by this LightManager");
        model.fillLightParameters(entry.parameters, offset);
        model.getLightData(entry.parameters, offset);
        entry.changed = true;
        this._inUpdate = false;
    },

    getModelEntry: function (id) {
        return this._models[id];
    },

    getModels: function (id) {
        return Object.keys(this._models);
    },

    getModelCount: function (id) {
        var model = this.getModelEntry(id);
        return model ? model.lightModels.length : 0;
    },

    _addModel: function (model) {
        var entry = this._models[model.id];
        if (!entry) {
            entry = this._models[model.id] = {lightModels: [], parameters: {}};
        }
        entry.lightModels.push(model);
        this._lightStructureChanged(entry);
    },

    _removeModel: function (model) {
        var entry = this.getModelEntry(model.id);
        var index = entry.lightModels.indexOf(model);
        if (index != -1) {
            entry.lightModels.splice(index, 1);
        }
        this._lightStructureChanged(entry);
    },

    _lightStructureChanged: function (entry) {
        this._inUpdate = true;
        var length = entry.lightModels.length;
        if (!length) {
            entry.parameters = {};
            return;
        }
        var model = entry.lightModels[0];
        entry.parameters = model.allocateParameterArray(length);
        entry.lightModels.forEach(function (lightModel, offset) {
            lightModel.fillLightParameters(entry.parameters, offset)
            lightModel.getLightData(entry.parameters, offset);
        });
        entry.changed = true;
        this._inUpdate = false;

    }
};

module.exports = LightManager;
