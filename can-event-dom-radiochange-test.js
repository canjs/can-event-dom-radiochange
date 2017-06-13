'use strict';

var QUnit = require('steal-qunit');
var domEvents = require('can-dom-events');
var compat = require('./compat');

function fixture () {
	return document.getElementById("qunit-fixture");
}

var overrideStrategy = {
	name: 'override()',
	setup: function () {
		this.removeEvent = compat(domEvents);
	},
	teardown: function () {
		this.removeEvent();
	}
};

function runTests (mod) {
	QUnit.module(mod.name, {
		setup: mod.setup,
		teardown: mod.teardown
	});

	test("subscription to an untracked radio should call listener", function (assert) {
		expect(1);
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
		expect(1);
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

runTests(overrideStrategy);
