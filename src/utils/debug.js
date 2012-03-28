XML3D.debug = {
    ALL : 0,
    DEBUG: 1,
    INFO : 2,
    WARNING : 3,
    ERROR : 4,
    EXCEPTION : 5,
    params : {},
    isSetup : false,
    loglevel : 4,
    loglevels : {
        all : 0,
        debug : 1,
        info : 2,
        warning : 3,
        error : 4,
        exception : 5,
    },

    setup : function() {
        var debug = XML3D.debug;
        if (!debug.isSetup) {
            var p = window.location.search.substr(1).split('&');
            p.forEach(function(e, i, a) {
              var keyVal = e.split('=');
              debug.params[keyVal[0].toLowerCase()] = decodeURIComponent(keyVal[1]);
            });
            debug.loglevel = debug.loglevels[debug.params.xml3d_loglevel] ||
                             debug.params.xml3d_loglevel ||
                             debug.loglevels.error;

            XML3D.debug.isSetup = true;
        }
        return !XML3D.debug.params.xml3d_nolog;
    },
    doLog : function(msg, logType) {
        var params = XML3D.debug.params;
        if (params.xml3d_nolog || logType < XML3D.debug.loglevel) {
            return;
        }

        if (window.console) {
            switch (logType) {
            case XML3D.debug.INFO:
                window.console.info(msg);
                break;
            case XML3D.debug.WARNING:
                window.console.warn(msg);
                break;
            case XML3D.debug.ERROR:
                window.console.error(msg);
                break;
            case XML3D.debug.EXCEPTION:
                window.console.debug(msg);
                break;
            case XML3D.debug.DEBUG:
                window.console.debug(msg);
                break;
            default:
                break;
            }
        }
    },
    logDebug : function(msg) {
        XML3D.debug.doLog(msg, XML3D.debug.DEBUG);
    },
    logInfo : function(msg) {
        XML3D.debug.doLog(msg, XML3D.debug.INFO);
    },
    logWarning : function(msg) {
        XML3D.debug.doLog(msg, XML3D.debug.WARNING);
    },
    logError : function(msg) {
        XML3D.debug.doLog(msg, XML3D.debug.ERROR);
    },
    logException : function(msg) {
        XML3D.debug.doLog(msg, XML3D.debug.EXCEPTION);
    },
    assert : function(c, msg) {
        if (!c) {
            XML3D.debug.doLog("Assertion failed in "
                    + XML3D.debug.assert.caller.name + ': ' + msg,
                    XML3D.debug.WARNING);
        }
    }
};
