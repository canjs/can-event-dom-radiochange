'use strict';

var domData = require('can-dom-data-state');
var getDocument = require('can-globals/document/document');
var domEvents = require('can-dom-events');
var CIDMap = require('can-cid/map/map');

function getRoot (el) {
	return el.ownerDocument || getDocument().documentElement;
}

function getRegistryName (eventName) {
	return 'can-event-radiochange:' + eventName + ':registry';
}

function getListenerName (eventName) {
	return 'can-event-radiochange:' + eventName + ':listener';
}

function getRegistry (root, eventName) {
	var name = getRegistryName(eventName);
	var registry = domData.get.call(root, name);
	if (!registry) {
		registry = new CIDMap();
		domData.set.call(root, name, registry);
	}
	return registry;
}

function findParentForm (el) {
	while (el) {
		if (el.nodeName === 'FORM') {
			break;
		}
		el = el.parentNode;
	}
	return el;
}

function shouldReceiveEventFromRadio (source, dest) {
	// Must have the same name attribute and parent form
	var name = source.getAttribute('name');
	return (
		name &&
		name === dest.getAttribute('name') &&
		findParentForm(source) === findParentForm(dest)
	);
}

function isRadioInput (el) {
	return el.nodeName === 'INPUT' && el.type === 'radio';
}

function dispatch (eventName, target) {
	var root = getRoot(target);
	var registry = getRegistry(root, eventName);
	registry.forEach(function (el) {
		if (shouldReceiveEventFromRadio(target, el)) {
			domEvents.dispatch(el, eventName);
		}
	});
}

function attachRootListener (root, eventName, events) {
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
	events.addEventListener(root, 'change', newListener);
	domData.set.call(root, listenerName, newListener);
}

function detachRootListener (root, eventName, events) {
	var listenerName = getListenerName(eventName);
	var listener = domData.get.call(root, listenerName);
	if (!listener) {
		return;
	}
	var registry = getRegistry(root, eventName);
	if (registry.size > 0) {
		return;
	}
	events.removeEventListener(root, 'change', listener);
	domData.clean.call(root, listenerName);
}

function addListener (eventName, el, events) {
	if (!isRadioInput(el)) {
		throw new Error('Listeners for ' + eventName + ' must be radio inputs');
	}
	var root = getRoot(el);
	getRegistry(root, eventName).set(el, el);
	attachRootListener(root, eventName, events);
}

function removeListener (eventName, el, events) {
	var root = getRoot(el);
	getRegistry(root, eventName).delete(el);
	detachRootListener(root, eventName, events);
}

/**
 * @module {events} can-event-dom-radiochange
 * @parent can-dom-utilities
 * @collection can-infrastructure
 * @package ./package.json
 *
 * A custom event for listening to changes of inputs with type "radio",
 * which fires when a conflicting radio input changes. A "conflicting"
 * radio button has the same "name" attribute and exists within in the
 * same form, or lack thereof. This event coordinates state bound to
 * whether a radio is checked. The "change" event does not fire for deselected
 * radios. By using this event instead, deselected radios receive notification.
 *
 * ```js
 * var domEvents = require('can-dom-events');
 * var radioChange = require('can-event-dom-radiochange');
 * domEvents.addEvent(radioChange);
 *
 * var target = document.createElement('input');
 *
 * function handler () {
 * 	console.log('radiochange event fired');
 * }
 *
 * domEvents.addEventListener(target, 'radiochange', handler);
 * domEvents.removeEventListener(target, 'radiochange', handler);
 * ```
 */
module.exports = {
	defaultEventType: 'radiochange',

	addEventListener: function (target, eventName, handler) {
		addListener(eventName, target, this);
		target.addEventListener(eventName, handler);
	},

	removeEventListener: function (target, eventName, handler) {
		removeListener(eventName, target, this);
		target.removeEventListener(eventName, handler);
	}
};
