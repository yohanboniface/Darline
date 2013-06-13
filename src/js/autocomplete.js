
D.autoComplete = function (el, options) {

    var API = {
        options: {
            placeholder: "Start typing...",
            emptyMessage: "No result",
            allowFree: true,
            minChar: 2,
            maxResults: 5
        },

        CACHE: '',
        RESULTS: [],

        _init: function (el, options) {
            this.el = D.DOM.get(el);
            this.options = L.Util.extend(this.options, options);
            var CURRENT = null;
            try {
                Object.defineProperty(this, "CURRENT", {
                    get: function () {
                        return CURRENT;
                    },
                    set: function (index) {
                        if (typeof index === "object") {
                            index = this.resultToIndex(index);
                        }
                        CURRENT = index;
                    }
                });
            } catch (e) {
                // Hello IE8
            }
            return this;
        },

        createInput: function () {
            this.input = D.DOM.create('input', {
                type: 'text',
                placeholder: this.options.placeholder,
                autocomplete: "off"
            });
            D.DOM.insertBefore(this.el, this.input);
            D.Event.on(this.input, "keydown", this.onKeyDown, this);
            D.Event.on(this.input, "keyup", this.onKeyUp, this);
            D.Event.on(this.input, "blur", this.onBlur, this);
        },

        createContainer: function () {
            this.container = D.DOM.create('ul', {className: 'darline-autocomplete'}, D.DOM.body);
        },

        resizeContainer: function()
        {
            var l = D.DOM.getLeft(this.input);
            var t = D.DOM.getTop(this.input) + this.input.offsetHeight;
            this.container.style.left = l + 'px';
            this.container.style.top = t + 'px';
            var width = this.options.width ? this.options.width : this.input.offsetWidth - 2;
            this.container.style.width = width + "px";
        },

        onKeyDown: function (e) {
            switch (e.keyCode) {
                case D.Keys.TAB:
                    if(this.CURRENT !== null)
                    {
                        this.setChoice();
                    }
                    D.Event.stop(e);
                    break;
                case D.Keys.RETURN:
                    D.Event.stop(e);
                    this.setChoice();
                    break;
                case D.Keys.ESC:
                    D.Event.stop(e);
                    this.hide();
                    break;
                case D.Keys.DOWN:
                    if(this.RESULTS.length > 0) {
                        if(this.CURRENT !== null && this.CURRENT < this.RESULTS.length - 1) { // what if one resutl?
                            this.CURRENT++;
                            this.highlight();
                        }
                        else if(this.CURRENT === null) {
                            this.CURRENT = 0;
                            this.highlight();
                        }
                    }
                    break;
                case D.Keys.UP:
                    if(this.CURRENT !== null) {
                        D.Event.stop(e);
                    }
                    if(this.RESULTS.length > 0) {
                        if(this.CURRENT > 0) {
                            this.CURRENT--;
                            this.highlight();
                        }
                        else if(this.CURRENT === 0) {
                            this.CURRENT = null;
                            this.highlight();
                        }
                    }
                    break;
            }
        },

        onKeyUp: function (e) {
            var special = [
                D.Keys.TAB,
                D.Keys.RETURN,
                D.Keys.LEFT,
                D.Keys.RIGHT,
                D.Keys.DOWN,
                D.Keys.UP,
                D.Keys.APPLE,
                D.Keys.SHIFT,
                D.Keys.ALT,
                D.Keys.CTRL
            ];
            if (special.indexOf(e.keyCode) === -1)
            {
                this.search();
            }
        },

        onBlur: function (e) {
            var self = this;
            setTimeout(function () {
                self.hide();
            }, 100);
        },

        clear: function () {
            this.RESULTS = [];
            this.CURRENT = null;
            this.CACHE = '';
            this.container.innerHTML = '';
        },

        hide: function() {
            this.clear();
            this.container.style.display = 'none';
            this.input.value = "";
        },

        setChoice: function (choice) {
            choice = choice || this.RESULTS[this.CURRENT];
            if (choice) {
                this.input.value = choice.display;
                this.select(choice);
                this.displaySelected(choice);
                this.hide();
                if (this.options.callback) {
                    D.Util.bind(this.options.callback, this)(choice);
                }
            }
        },

        search: function() {
            var val = this.input.value;
            if (val.length < this.options.minChar) {
                this.clear();
                return;
            }
            if(!val) {
                this.clear();
                return;
            }
            if( val + '' === this.CACHE + '') {
                return;
            }
            else {
                this.CACHE = val;
            }
            var results = this._do_search(val);
            return this.handleResults(results);
        },

        createResult: function (item) {
            var el = D.DOM.create('li', {}, this.container);
            el.innerHTML = item.display;
            var result = {
                value: item.value,
                display: item.display,
                el: el
            };
            D.Event.on(el, 'mouseover', function (e) {
                this.CURRENT = result;
                this.highlight();
            }, this);
            D.Event.on(el, 'mousedown', function (e) {
                this.setChoice();
            }, this);
            return result;
        },

        resultToIndex: function (result) {
            var out = null;
            D.DOM.forEach(this.RESULTS, function (item, index) {
                if (item.value == result.value) {
                    out = index;
                    return;
                }
            });
            return out;
        },

        handleResults: function(data) {
            var self = this;
            this.clear();
            this.container.style.display = "block";
            this.resizeContainer();
            D.DOM.forEach(data, function (item, index) {
                self.RESULTS.push(self.createResult(item));
            });
            this.CURRENT = 0;
            this.highlight();
            //TODO manage no results
        },

        highlight: function () {
            var self = this;
            D.DOM.forEach(this.RESULTS, function (item, index) {
                if (index === self.CURRENT) {
                    D.DOM.addClass(item.el, 'on');
                }
                else {
                    D.DOM.removeClass(item.el, 'on');
                }
            });
        }

    };

    var MULTISELECT = {

        init: function (el, options) {
            this._init(el, options);
            if (!this.el) return this;
            this.el.style.display = "none";
            this.createInput();
            this.createContainer();
            this.initSelectedContainer();
        },

        initSelectedContainer: function (initial) {
            this.selected_container = D.DOM.insertAfter(this.input, D.DOM.create('ul', {className: 'darline-multiresult'}));
            var self = this;
            D.DOM.forEach(this.el, function (option) {
                if (option.selected) {
                    self.displaySelected(self.optionToResult(option));
                }
            });
        },

        optionToResult: function (option) {
            return {
                value: option.value,
                display: option.innerHTML
            };
        },

        displaySelected: function (result) {
            var result_el = D.DOM.create('li', {}, this.selected_container);
            result_el.innerHTML = result.display;
            var close = D.DOM.create('span', {className: 'close'}, result_el);
            close.innerHTML = "×";
            D.Event.on(close, 'click', function () {
                this.selected_container.removeChild(result_el);
                this.unselect(result);
            }, this);
            this.hide();
        },

        _do_search: function (val) {
            var results = [],
                self = this,
                count = 0;
            D.DOM.forEach(this.el, function (item, index) {
                if (item.innerHTML.indexOf(val) !== -1 && !item.selected && count < self.options.maxResults) {
                    results.push(self.optionToResult(item));
                    count++;
                }
            });
            return results;
        },

        select: function (option) {
            D.DOM.forEach(this.el, function (item, index) {
                if (item.value == option.value) {
                    item.selected = true;
                }
            });
        },

        unselect: function (option) {
            D.DOM.forEach(this.el, function (item, index) {
                if (item.value == option.value) {
                    item.selected = false;
                }
            });
        }

    };

    this.multiselect = function () {
        return D.Util.extend(API, MULTISELECT).init(el, options);
    };
    return this;

};