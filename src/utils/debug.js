(function (ns) {

    var OPTION_LOGLEVEL = "loglevel";
    XML3D.options.register(OPTION_LOGLEVEL, "warning");

    ns.debug = {
        ALL: 0,
        DEBUG: 1,
        INFO: 2,
        WARNING: 3,
        ERROR: 4,
        EXCEPTION: 5,
        params: {},
        isSetup: false,
        loglevel: 4,
        loglevels: {
            all: 0,
            debug: 1,
            info: 2,
            warning: 3,
            error: 4,
            exception: 5
        },

        setup: function () {
            var debug = XML3D.debug;
            if (!debug.isSetup) {
                debug.isSetup = true;
                debug.loglevel = debug.loglevels[XML3D.options.getValue(OPTION_LOGLEVEL)] || 3;
                XML3D.options.addObserver(function(key, value) {
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
                        window.console.error(XML3D.debug.printStackTrace({e: args[0], guess: true}).join('\n'));
                        break;
                    case XML3D.debug.DEBUG:
                        window.console.debug.apply(window.console, args);
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
        logException: function () {
            XML3D.debug.doLog(XML3D.debug.EXCEPTION, arguments);
        },
        assert: function (c, msg) {
            if (!c) {
                var caller = XML3D.debug.assert.caller ? XML3D.debug.assert.caller.name : null;

                if (caller)
                    XML3D.debug.doLog(XML3D.debug.WARNING, ["Assertion failed in " + caller, msg ]); else
                    XML3D.debug.doLog(XML3D.debug.WARNING, ["Assertion failed", msg ]);
            }
        },
        trace: function (msg, logType) {
            logType = logType !== undefined ? logType : XML3D.debug.ERROR;
            if (window.console.trace) {
                if (msg) {
                    XML3D.debug.doLog(logType, [msg]);
                }
                window.console.trace();
            } else {
                var stack = XML3D.debug.printStackTrace();
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

}(XML3D))
