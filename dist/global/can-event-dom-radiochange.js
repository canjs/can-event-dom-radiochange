/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod){
		if(!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, "default": true };
		for(var p in mod) {
			if(!esProps[p]) return false;
		}
		return true;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			if(useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*can-event-dom-radiochange@0.0.0#can-event-dom-radiochange*/
define('can-event-dom-radiochange', function (require, exports, module) {
    'use strict';
    var events = require('can-util/dom/events/events');
    var domData = require('can-util/dom/data/data');
    var getDocument = require('can-util/dom/document/document');
    var domEvents = require('can-dom-events');
    var CIDMap = require('can-util/js/cid-map/cid-map');
    function getRoot(el) {
        return el.ownerDocument || getDocument().documentElement;
    }
    function getRegistryName(eventName) {
        return 'can-event-radiochange:' + eventName + ':registry';
    }
    function getListenerName(eventName) {
        return 'can-event-radiochange:' + eventName + ':listener';
    }
    function getRegistry(root, eventName) {
        var name = getRegistryName(eventName);
        var registry = domData.get.call(root, name);
        if (!registry) {
            registry = new CIDMap();
            domData.set.call(root, name, registry);
        }
        return registry;
    }
    function findParentForm(el) {
        while (el) {
            if (el.nodeName === 'FORM') {
                break;
            }
            el = el.parentNode;
        }
        return el;
    }
    function shouldReceiveEventFromRadio(source, dest) {
        var name = source.getAttribute('name');
        return name && name === dest.getAttribute('name') && findParentForm(source) === findParentForm(dest);
    }
    function isRadioInput(el) {
        return el.nodeName === 'INPUT' && el.type === 'radio';
    }
    function dispatch(eventName, target) {
        var root = getRoot(target);
        var registry = getRegistry(root, eventName);
        registry.forEach(function (el) {
            if (shouldReceiveEventFromRadio(target, el)) {
                domEvents.dispatch(el, eventName);
            }
        });
    }
    function attachRootListener(root, eventName) {
        var listenerName = getListenerName(eventName);
        var listener = domData.get.call(root, listenerName);
        if (listener) {
            return;
        }
        var newListener = function (event) {
            var target = event.target;
            if (isRadioInput(target)) {
                dispatch(eventName, target);
            }
        };
        events.addEventListener.call(root, 'change', newListener);
        domData.set.call(root, listenerName, newListener);
    }
    function detachRootListener(root, eventName) {
        var listenerName = getListenerName(eventName);
        var listener = domData.get.call(root, listenerName);
        if (!listener) {
            return;
        }
        var registry = getRegistry(root, eventName);
        if (registry.size > 0) {
            return;
        }
        events.removeEventListener.call(root, 'change', listener);
        domData.clean.call(root, listenerName);
    }
    function addListener(eventName, el) {
        if (!isRadioInput(el)) {
            throw new Error('Listeners for ' + eventName + ' must be radio inputs');
        }
        var root = getRoot(el);
        getRegistry(root, eventName).set(el, el);
        attachRootListener(root, eventName);
    }
    function removeListener(eventName, el) {
        var root = getRoot(el);
        getRegistry(root, eventName).delete(el);
        detachRootListener(root, eventName);
    }
    module.exports = {
        defaultEventType: 'radiochange',
        addEventListener: function (target, eventName, handler) {
            addListener(eventName, target);
            target.addEventListener(eventName, handler);
        },
        removeEventListener: function (target, eventName, handler) {
            removeListener(eventName, target);
            target.removeEventListener(eventName, handler);
        }
    };
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();