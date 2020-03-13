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
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {Develry.Specter.Interface.Browser}   browser_interface
 */
var Tab = Fn.inherits('Develry.Specter.Interface.Tab', 'Develry.Specter.Interface.Puppeteer', function Tab(browser_interface) {
	Tab.super.call(this, browser_interface);
});

/**
 * Init this tab interface
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setMethod(function init() {

	var that = this;

	// Wait for the browser interface to be ready
	this.browser_interface.afterOnce('ready', async function afterReady() {

		// Create a new page
		var page = await that.browser_interface.browser_instance.newPage();

		// Store it as the tab instance
		that.tab_instance = page;

		// Now this tab is also ready
		that.emit('ready');

		// Add the basic listeners
		that.addPageListeners();
	});
});

/**
 * Goto a url
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @return   {Pledge}
 */
Tab.setAfterMethod('ready', async function goto(url) {

	var that = this;

	// Goto the url
	await this.tab_instance.goto(url);
});

/**
 * Add the page listeners
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setMethod(function addPageListeners() {

	const that = this;

	this.tab_instance.on('domcontentloaded', function onLoaded() {
		that.emit('loaded');
	});
});

/**
 * Evaluate code right now
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setMethod(function evaluate(code, args) {
	return this.tab_instance.evaluate(code, args);
});

/**
 * Inject a script by url
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setMethod(function injectScript(uri) {

	let config = {},
	    path;

	if (uri.indexOf('http:') == 0 || uri.indexOf('https:') == 0) {
		config.url = uri;
	} else {
		config.path = uri;
	}

	return this.tab_instance.addScriptTag(config);
});

/**
 * Set the viewport
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setAfterMethod('ready', function setViewport(options) {
	return this.tab_instance.setViewport(options);
});

/**
 * Close this tab
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setMethod(function close() {
	return this.tab_instance.close();
});