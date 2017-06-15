'use strict';

var events = require('can-util/dom/events/events');
var domData = require('can-util/dom/data/data');
var getDocument = require('can-util/dom/document/document');
var domEvents = require('can-dom-events');
var CIDMap = require('can-util/js/cid-map/cid-map');

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

function attachRootListener (root, eventName) {
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

function detachRootListener (root, eventName) {
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

function addListener (eventName, el) {
	if (!isRadioInput(el)) {
		throw new Error('Listeners for ' + eventName + ' must be radio inputs');
	}
	var root = getRoot(el);
	getRegistry(root, eventName).set(el, el);
	attachRootListener(root, eventName);
}

function removeListener (eventName, el) {
	var root = getRoot(el);
	getRegistry(root, eventName).delete(el);
	detachRootListener(root, eventName);
}

/**
 * @module {events} can-event-dom-radiochange
 * @parent can-infrastructure
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
		addListener(eventName, target);
		target.addEventListener(eventName, handler);
	},

	removeEventListener: function (target, eventName, handler) {
		removeListener(eventName, target);
		target.removeEventListener(eventName, handler);
	}
};
