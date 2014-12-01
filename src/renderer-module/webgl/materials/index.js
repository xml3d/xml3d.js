var c_globalScripts = {};

module.exports = {

    register: function (name, script) {
        c_globalScripts[name] = script;
        script.name = name;
    },

    getScript: function (script) {
        return c_globalScripts[script];
    }
};

