var puppeteer = require('puppeteer'),
    Blast     = __Protoblast,
    Fn        = Blast.Bound.Function;

// Get the Specter namespace
var Specter = Fn.getNamespace('Develry.Specter');

/**
 * The Puppeteer Browser Interface Class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Specter.Browser}   browser
 */
var Browser = Fn.inherits('Develry.Specter.Interface.Browser', 'Develry.Specter.Interface.Puppeteer', function Browser(browser) {
	Browser.super.call(this, browser);
});

/**
 * Init this browser interface
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setMethod(async function init() {

	var that = this;

	this._launching = puppeteer.launch();

	let browser = await this._launching;

	this._launching = null;

	if (this.destroyed) {
		browser.close();
		return;
	}

	// Store this as the actual browser instance
	this.browser_instance = browser;

	// Now we are ready for creating new pages
	this.emit('ready');
});

/**
 * Destroy this browser
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setMethod(async function destroy() {

	this.destroyed = true;

	if (this._launching) {
		await this._launching;
	}

	if (this.browser_instance) {
		return this.browser_instance.close();
	}
});