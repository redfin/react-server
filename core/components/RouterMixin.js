/**
 * Copyright 2014, Yahoo! Inc.
 * Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
 /**
  * Redfin: converted to not use a dispatcher or navigateAction, and to use a different
  * form for triggering navigation. Removed setImmediate?
  */
'use strict';

var History = require('./History'),
    ClientRequest = require("../ClientRequest"),
    EVT_PAGELOAD = 'pageload',
    EVT_POPSTATE = 'popstate',
    RouterMixin;

// require('setimmediate');

function routesEqual(route1, route2) {
    route1 = route1 || {};
    route2 = route2 || {};
    return (route1.path === route2.path);
}

RouterMixin = {
    componentDidMount: function() {
        var self = this,
            context = self.props.context,
            pathFromHistory,
            pathFromState = self.state.route.path;

        self._history = ('function' === typeof self.props.historyCreator) ? self.props.historyCreator() : new History();
        pathFromHistory = self._history.getPath();

        if (context && (pathFromHistory !== pathFromState)) {

            // REDFIN-TODO: do we need this business? We're already doing this ourselves, and our 'navigate'
            // needs to do things in its callback

            // YAHOO: put it in setImmediate, because we need the base component to have
            // store listeners attached, before navigateAction is executed.
            // setImmediate(function navigateToActualRoute() {
            //     context.executeAction(navigateAction, {type: EVT_PAGELOAD, path: pathFromHistory});
            // });
        }

        self._historyListener = function (e) {
            if (context) {
                var path = self._history.getPath();

                // REDFIN-TODO: this appears to pass some state. Should we figure out how to replicate that?
                // context.executeAction(navigateAction, {type: EVT_POPSTATE, path: path, params: e.state});

                context.navigate(new ClientRequest(path), EVT_POPSTATE);
                
            }
        };
        self._history.on(self._historyListener);
    },
    componentWillUnmount: function() {
        this._history.off(this._historyListener);
        this._historyListener = null;
        this._history = null;
    },
    componentDidUpdate: function (prevProps, prevState) {
        var newState = this.state;
        if (routesEqual(prevState && prevState.route, newState && newState.route)) {
            return;
        }
        var nav = newState.route.navigate;
        if (nav.type !== EVT_POPSTATE && nav.type !== EVT_PAGELOAD) {
            this._history.pushState(nav.params || null, null, newState.route.path);
        }
    }
};

module.exports = RouterMixin;
