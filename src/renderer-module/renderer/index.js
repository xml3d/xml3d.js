var Constants = require("./scene/constants.js");

module.exports = {
    toString: function () {
        return "renderer";
    },
    Scene: require("./scene/scene.js"),
    EVENT_TYPE: Constants.EVENT_TYPE,
    NODE_TYPE: Constants.NODE_TYPE

};
