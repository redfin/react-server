'use strict';

var _reactServer = require('react-server');

var label = 'foo';
var logger = _reactServer.logging.getLogger({"name":"unknown","color":{"server":207,"client":"rgb(212,42,212)"}});
var fooLogger = _reactServer.logging.getLogger({"name":"unknown","color":{"server":207,"client":"rgb(212,42,212)"}}({ label: label }));
