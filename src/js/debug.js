D.Toolbox = function() {
    var container = D.DOM.create('div', {
        className: "col _35 darline-grid-container"
    }, D.DOM.body);
    var grid = D.DOM.create('div', {
        id: "darline-grid",
        className: "_35"
    }, container);
    for (var i=1; i<=35; i++) {
        D.DOM.create('div', {
            className: "col _1 darline-grid-col",
            title: "col " + i
        }, grid);
    }
    // Toolbox
    var toolbox = D.DOM.create('div', {id: "darline-toolbox"}, D.DOM.body);
    var a = D.DOM.create('a', {className: 'toggle-toolbox'}, toolbox);
    var toggleToolbox = function (e) {
        D.DOM.toggleClass(this.parentNode, "on");
    };
    D.Event.on(a, 'click', toggleToolbox);
    a = D.DOM.create('a', {className: 'toggle-grid'}, toolbox);
    var toggleGrid = function (e) {
        D.DOM.toggleDisplay(container);
    };
    D.Event.on(a, 'click', toggleGrid);
};