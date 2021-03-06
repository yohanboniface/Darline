Darline = D = {}; // TODO avoid conflict

D.Util = {
    bind: function (fn, obj) { // From Leaflet
        var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
        return function () {
            return fn.apply(obj, args || arguments);
        };
    },

    extend: function (dest) { // From Leaflet
        var sources = Array.prototype.slice.call(arguments, 1),
            i, j, len, src;

        for (j = 0, len = sources.length; j < len; j++) {
            src = sources[j] || {};
            for (i in src) {
                if (src.hasOwnProperty(i)) {
                    dest[i] = src[i];
                }
            }
        }
        return dest;
    }
};

var enforceSelector = function (fn) {
    return function () {
        var el = D.DOM.get(arguments[0]),
            args = Array.prototype.slice.call(arguments, 1);
        if (el instanceof NodeList) {
            D.DOM.forEach(el, function (item) { fn(item, args); });
            return;
        }
        fn(el, args);
    };
};

D.DOM = {

    selectorIsId: function (selector) {
        return new RegExp(/#([\w\-_]+$)/).test(selector);
    },

    isNode: function (el) {
        return (el.nodeType && el.nodeType === 1);
    },

    isNodeList: function (el) {
        return (!!NodeList && el instanceof NodeList);
    },

    get: function (query, el) {
        if (this.isNode(query) || this.isNodeList(query)) {
            return query;
        }
        if (typeof el === "undefined") {
            el = document;
        }
        if (D.DOM.selectorIsId(query)) {
            return el.querySelector(query);
        }
        else {
            return el.querySelectorAll(query);
        }
    },

    forEach: function (els, callback) {
        Array.prototype.forEach.call(els, callback);
    },

    create: function (what, attrs, parent) {
        var el = document.createElement(what);
        for (var attr in attrs) {
            el[attr] = attrs[attr];
        }
        if (typeof parent !== "undefined") {
            parent.appendChild(el);
        }
        return el;
    },

    hasClass: function (el, name) { // From Leaflet
        return (el.className.length > 0) &&
                new RegExp("(^|\\s)" + name + "(\\s|$)").test(el.className);
    },

    addClass: function (el, name) {
        el = D.DOM.get(el);
        if (!D.DOM.hasClass(el, name)) {
            el.className += (el.className ? ' ' : '') + name;
        }
    },

    removeClass: function (el, name) { // from Leaflet

        function replaceFn(w, match) {
            if (match === name) { return ''; }
            return w;
        }

        el.className = el.className
                .replace(/(\S+)\s*/g, replaceFn)
                .replace(/(^\s+|\s+$)/, '');
    },

    toggleClass: function (el, name) {
        if (D.DOM.hasClass(el, name)) {
            D.DOM.removeClass(el, name);
        }
        else {
            D.DOM.addClass(el, name);
        }
    },

    toggleDisplay: function (el, displayValue) {
        if (el.style.display !== "none" && el.style.display !== "") {
            el.data.oldDisplay = el.style.display;
            el.style.display = "none";
        }
        else {
            el.style.display = el.data.oldDisplay || displayValue || "block";
        }
    },

    insertAfter: function (target, el)
    {
        target.parentNode.insertBefore(el, target.nextSibling);
        return el;
    },

    insertBefore: function (target, el)
    {
        target.parentNode.insertBefore(el, target);
        return el;
    },

    getLeft: function (el) {
        var tmp = el.offsetLeft;
        el = el.offsetParent;
        while(el) {
            tmp += el.offsetLeft;
            el = el.offsetParent;
        }
        return tmp;
    },

    getTop: function (el) {
        var tmp = el.offsetTop;
        el = el.offsetParent;
        while(el) {
            tmp += el.offsetTop;
            el = el.offsetParent;
        }
        return tmp;
    }
};

try {
    Object.defineProperty(D.DOM, "body", {
        get: function () {
            if (!D.DOM._body) {
                D.DOM._body = document.querySelector('body');
            }
            return D.DOM._body;
        }

    });
}
catch (e) {
    D.DOM.body = null;
}

D.Event = {
    on: function (el, type, fn, thisobj) {
        el = D.DOM.get(el);
        if (D.DOM.isNodeList(el)) {
            return D.DOM.forEach(el, function (item) { D.Event.on(item, type, fn, thisobj); });
        }
        el.addEventListener(type, D.Util.bind(fn, thisobj || el));
        return this;
    },

    stop: function (e) {
        e.preventDefault();
        e.stopPropagation();
    }
};

D.Xhr = {
    _ajax: function (verb, uri, options) {
        var default_options = {
            'async': true,
            'callback': null,
            'responseType': "text",
            'data': null
        };
        settings = D.Util.extend({}, default_options, options);

        var xhr = new XMLHttpRequest();
        xhr.open(verb, uri, settings.async);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        xhr.onload = function(e) {
            if (this.status == 200) {
                if (settings.callback) {
                    var raw = this.response;
                    if (settings.dataType == "json") {
                        raw = JSON.parse(raw);
                    }
                    settings.callback.call(settings.thisobj, raw);
                }
            }
        };

        xhr.send(settings.data);
    },

    get: function(uri, options) {
        D.Xhr._ajax("GET", uri, options);
    },

    post: function(uri, options) {
        D.Xhr._ajax("POST", uri, options);
    },

    submit_form: function(form_id, options) {
        if(typeof options == "undefined") {
            options = {};
        }
        var form = D.DOM.get(form_id);
        var formData = new FormData(form);
        if(options.extraFormData) {
            formData.append(options.extraFormData);
        }
        options.data = formData;
        D.Xhr.post(form.action, options);
        return false;
    },

    listen_form: function (form_id, options) {
        var form = D.DOM.get(form_id);
        if (!form) {
            return;
        }
        D.Event.on(form, 'submit', D.Event.stop);
        D.Event.on(form, 'submit', function (e) {
                D.Xhr.submit_form(form_id, options);
            });
    }
};

D.Keys = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    TAB: 9,
    RETURN: 13,
    ESC: 27,
    APPLE: 91,
    SHIFT: 16,
    ALT: 17,
    CTRL: 18
};