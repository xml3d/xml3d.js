xml3d.debug = {
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
        var debug = xml3d.debug;
        if (!debug.isSetup) {
            var p = window.location.search.substr(1).split('&');
            p.forEach(function(e, i, a) {
              var keyVal = e.split('=');
              debug.params[keyVal[0].toLowerCase()] = decodeURIComponent(keyVal[1]);
            });
            debug.loglevel = debug.loglevels[debug.params.xml3d_loglevel] ||
                             debug.params.xml3d_loglevel ||
                             debug.loglevels.error;

            xml3d.debug.isSetup = true;
        }
        return !xml3d.debug.params.xml3d_nolog;
    },
    doLog : function(msg, logType) {
        var params = xml3d.debug.params;
        if (params.xml3d_nolog || logType < xml3d.debug.loglevel) {
            return;
        }

        if (window.console) {
            switch (logType) {
            case xml3d.debug.INFO:
                window.console.info(msg);
                break;
            case xml3d.debug.WARNING:
                window.console.warn(msg);
                break;
            case xml3d.debug.ERROR:
                window.console.error(msg);
                break;
            case xml3d.debug.EXCEPTION:
                window.console.debug(msg);
                break;
            case xml3d.debug.DEBUG:
                window.console.debug(msg);
                break;
            default:
                break;
            }
        }
    },
    logDebug : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.DEBUG);
    },
    logInfo : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.INFO);
    },
    logWarning : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.WARNING);
    },
    logError : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.ERROR);
    },
    logException : function(msg) {
        xml3d.debug.doLog(msg, xml3d.debug.EXCEPTION);
    },
    assert : function(c, msg) {
        if (!c) {
            xml3d.debug.doLog("Assertion failed in "
                    + xml3d.debug.assert.caller.name + ': ' + msg,
                    xml3d.debug.WARNING);
        }
    }
};
