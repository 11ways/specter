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
 * Get the render_delay for the currently attached tab
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setProperty(function render_delay() {

	if (!this.tab) {
		return 0;
	}

	return this.tab.render_delay || 0;
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

	if (!url) {
		throw new Error('Need a URL to go to');
	}

	let tab = this.tab_instance;

	// Goto the url
	await tab.goto(url, {
		waitUntil: 'networkidle2'
	});

	let response_event_occurred = false;

	function responseHandler(event) {
		response_event_occurred = true;
	}

	// Do some waiting in case there's a window.location redirect
	let response_watcher = new Promise(function waitForResponse(resolve, reject) {

		setTimeout(function afterTimeout() {

			if (!response_event_occurred) {
				resolve();
			} else {
				setTimeout(resolve, 10 * 1000);
			}

			tab.removeListener('response', responseHandler);
		}, 500);
	});

	tab.on('response', responseHandler);

	await Promise.race([response_watcher, tab.waitForNavigation()]);
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

		if (that.render_delay == 0) {
			that.emit('rendered');
		} else {
			setTimeout(function waitForDelay() {
				that.emit('rendered');
			}, that.render_delay);
		}
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
 * Make a screenshot
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 */
Tab.setMethod(function screenshot(options) {
	return this.tab_instance.screenshot(options);
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
 * Set the cookies
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {Object}   cookies
 */
Tab.setAfterMethod('ready', async function setCookies(cookies) {

	if (!Array.isArray(cookies)) {
		cookies = Blast.Bound.Object.values(cookies);
	}

	await this.tab_instance.setCookie(...cookies);
});

/**
 * Set the headers
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {Object}   headers
 */
Tab.setAfterMethod('ready', async function setHeaders(headers) {
	await this.tab_instance.setExtraHTTPHeaders(headers);
});

/**
 * Set the credentials
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.1
 * @version  0.1.1
 *
 * @param    {Object}   credentials
 */
Tab.setAfterMethod('ready', async function setCredentials(credentials) {
	await this.tab_instance.authenticate(credentials);
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