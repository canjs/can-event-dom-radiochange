'use strict';

var QUnit = require('steal-qunit');
var domEvents = require('can-dom-events');
var oldEvents = require('can-util/dom/events/events');
var definition = require('./can-event-dom-radiochange');
var compat = require('./compat');

function fixture () {
	return document.getElementById("qunit-fixture");
}

// Fix oldEvent calls to match new syntax
function newifyOldEvents (oldEvents) {
	return {
		addEventListener: function (target) {
			var args = Array.prototype.slice.call(arguments, 1);
			return oldEvents.addEventListener.apply(target, args);
		},
		removeEventListener: function (target) {
			var args = Array.prototype.slice.call(arguments, 1);
			return oldEvents.removeEventListener.apply(target, args);
		},
		dispatch: function (target) {
			var args = Array.prototype.slice.call(arguments, 1);
			return oldEvents.dispatch.apply(target, args);
		},
	};
}

var compatWithNew = {
	name: 'compat with can-dom-events',
	domEvents: domEvents,
	setup: function () {
		this.removeEvent = compat(domEvents);
	},
	teardown: function () {
		this.removeEvent();
	}
};

var compatWithOld = {
	name: 'compat with can-util/dom/events',
	domEvents: newifyOldEvents(oldEvents),
	setup: function () {
		this.removeEvent = compat(oldEvents);
	},
	teardown: function () {
		this.removeEvent();
	}
};

var rawNewDomEvents = {
	name: 'plain with can-dom-events',
	domEvents: domEvents,
	setup: function () {
		this.removeEvent = domEvents.addEvent(definition);
	},
	teardown: function () {
		this.removeEvent();
	}
};

var suites = [
	compatWithOld,
	compatWithNew,
	rawNewDomEvents
];

function runTests (mod) {
	QUnit.module(mod.name, {
		setup: mod.setup,
		teardown: mod.teardown
	});

	var domEvents = mod.domEvents;

	test("subscription to an untracked radio should call listener", function (assert) {
		assert.expect(1);
		var listener = document.createElement('input');
		listener.id = 'listener';
		listener.type = 'radio';
		listener.name = 'myfield';
		domEvents.addEventListener(listener, 'radiochange', function handler () {
			assert.ok(true, 'called from other element');
			domEvents.removeEventListener(listener, 'radiochange', handler);
		});

		var radio = document.createElement('input');
		radio.id = 'radio';
		radio.type = 'radio';
		radio.name = 'myfield';

		fixture().appendChild(listener);
		fixture().appendChild(radio);

		radio.setAttribute('checked', 'checked');
		domEvents.dispatch(radio, 'change');
	});

	test("subscription to a tracked radio should call itself", function (assert) {
		assert.expect(1);
		var radio = document.createElement('input');
		radio.id = 'selfish';
		radio.type = 'radio';
		radio.name = 'anynamejustsothereisaname';
		domEvents.addEventListener(radio, 'radiochange', function handler () {
			assert.ok(true, 'called from self');
			domEvents.removeEventListener(radio, 'radiochange', handler);
		});

		fixture().appendChild(radio);

		radio.setAttribute('checked', 'checked');
		domEvents.dispatch(radio, 'change');
	});
}

suites.forEach(runTests);
