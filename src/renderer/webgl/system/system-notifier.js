var SystemNotifier = {
    node: null,

    setNode: function (node) {
        this.node = node;
    },

    sendEvent: function (type, data) {
        if (this.node) {
            var event = document.createEvent('CustomEvent');
            data.systemtype = type;
            event.initCustomEvent('xml3dsystem', true, true, data);
            this.node.dispatchEvent(event);
        }
    }
};

module.exports = SystemNotifier;
