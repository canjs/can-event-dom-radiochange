/*can-event-dom-radiochange@0.0.0#can-event-dom-radiochange*/
define(function (require, exports, module) {
    'use strict';
    var events = require('can-util/dom/events');
    var domData = require('can-util/dom/data');
    var getDocument = require('can-util/dom/document');
    var domEvents = require('can-dom-events');
    var CIDMap = require('can-util/js/cid-map');
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