var Constants = require("./scene/constants.js");

module.exports = {
    toString: function () {
        return "renderer";
    },
    EVENT_TYPE: Constants.EVENT_TYPE,
    NODE_TYPE: Constants.NODE_TYPE,
    factory : require("./renderer-factory.js")

};
