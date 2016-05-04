var printStackTrace = require("../contrib/stacktrace-0.4.js");
var Options = require("./options.js");
var assert = require("assert");

(function (ns) {

    var OPTION_LOGLEVEL = "loglevel";
    Options.register(OPTION_LOGLEVEL, "warning");

    ns.exports = {
        ALL: 0,
        DEBUG: 1,
        INFO: 2,
        WARNING: 3,
        ISSUE: 4,
        ERROR: 5,
        EXCEPTION: 6,
        params: {},
        isSetup: false,
        loglevel: 5,
        loglevels: {
            all: 0,
            debug: 1,
            info: 2,
            warning: 3,
            issue: 4,
            error: 5,
            exception: 6
        },

        setup: function () {
            var debug = XML3D.debug;
            if (!debug.isSetup) {
                debug.isSetup = true;
                debug.loglevel = debug.loglevels[Options.getValue(OPTION_LOGLEVEL)] || 3;
                Options.addObserver(function(key, value) {
                    if(key == OPTION_LOGLEVEL) {
                        debug.loglevel = debug.loglevels[value] || 3;
                    }
                })
            }
            return true;
        },
        _setLogLevel: function() {
        },
        doLog: function (logType, args) {
            var params = XML3D.debug.params;
            if (params.xml3d_nolog || logType < XML3D.debug.loglevel) {
                return;
            }
            args = Array.prototype.slice.call(args);
            if (window.console) {
                switch (logType) {
                    case XML3D.debug.INFO:
                        window.console.info.apply(window.console, args);
                        break;
                    case XML3D.debug.WARNING:
                        window.console.warn.apply(window.console, args);
                        break;
                    case XML3D.debug.ERROR:
                        window.console.error.apply(window.console, args);
                        break;
                    case XML3D.debug.EXCEPTION:
                        window.console.error(printStackTrace({e: args[0], guess: true}).join('\n'));
                        break;
                    case XML3D.debug.DEBUG:
                        window.console.debug.apply(window.console, args);
                        break;
                    case XML3D.debug.ISSUE:
                        assert(args[1] !== undefined, "Github issue number must be specified.");
                        var issue = args[0] + "\nMore information can be found at https://github.com/xml3d/xml3d.js/issues/" + args[1];
                        window.console.error.apply(window.console, [issue].concat(args.slice(2, args.length)));
                        break;
                    default:
                        break;
                }
            }
        },
        logDebug: function () {
            XML3D.debug.doLog(XML3D.debug.DEBUG, arguments);
        },
        logInfo: function () {
            XML3D.debug.doLog(XML3D.debug.INFO, arguments);
        },
        logWarning: function () {
            XML3D.debug.doLog(XML3D.debug.WARNING, arguments);
        },
        logError: function () {
            XML3D.debug.doLog(XML3D.debug.ERROR, arguments);
        },
        logIssue: function() {
            XML3D.debug.doLog(XML3D.debug.ISSUE, arguments);
        },
        logException: function () {
            XML3D.debug.doLog(XML3D.debug.EXCEPTION, arguments);
        },
        assert: assert,
        trace: function (msg, logType) {
            logType = logType !== undefined ? logType : XML3D.debug.ERROR;
            if (window.console.trace) {
                if (msg) {
                    XML3D.debug.doLog(logType, [msg]);
                }
                window.console.trace();
            } else {
                var stack = printStackTrace();
                msg && stack.splice(0, 0, msg);
                XML3D.debug.doLog(logType, stack);
            }
        },
        getNumberWithPadding: function (number, width) {
            var res = "" + number;
            while (res.length < width) res = " " + res;
            return res;
        },
        formatSourceCode: function (source) {
            var result = "";
            var sourceLines = source.split("\n");
            for (var i = 0; i < sourceLines.length; ++i) {
                result += this.getNumberWithPadding(i + 1, 3) + "  " + sourceLines[i] + "\n";
            }
            return result;
        }
    };

}(module));
