var Blast           = __Protoblast,
    Fn              = Blast.Bound.Function;

// Get the Sentana namespace
Specter = Blast.Bound.Function.getNamespace('Develry.Specter');

/**
 * The Specter Page Class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.2
 */
var Crawler = Fn.inherits('Informer', 'Develry.Specter', function Crawler(browser) {

	var that = this;

	// The main browser instance
	this.browser = browser;

	// The URLs to use to start the crawl
	// (Crawled links have to be in the same domain & path)
	this.start_urls = [];

	// The start page
	this.start_page = null;

	// Maximum level
	this.max_level = null;

	// The render timeout
	this.render_delay = 0;

	// Links and their pages
	this.pages = {};

	// Total amount of crawled pages
	this.page_count = 0;

	// Extensions to ignore
	this.ignore_extensions = [];

	// Custom url checks
	this.custom_url_checks = [];

	// Parameters to ignore
	// @TODO: Implement more parameters:
	// https://github.com/Smile4ever/Neat-URL
	this.ignore_parameters = [
		// Google analytics
		/^utm_/,
		/^ga_/,

		// Google Ads
		'gclid',
		'gclsrc',
		'dclid',

		// Facebook
		'fbclid',

		// Others
		'zanpid'
	];

	// Create a queue to prevent flooding a website
	this.queue = new Fn.createQueue({enabled: true, limit: 4});
});

/**
 * Get the amount of pages queued or done
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @type     {Number}
 */
Crawler.setProperty(function pages_queued_or_done() {
	return Object.keys(this.pages).length;
});

/**
 * Ignore the given extension
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 */
Crawler.decorateMethod(Blast.Decorators.loopOverArgument(), function ignoreExtension(extension) {
	extension = extension.toLowerCase();

	if (extension[0] == '.') {
		extension = extension.slice(1);
	}

	this.ignore_extensions.push(extension);
});

/**
 * Ignore the given parameter
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 */
Crawler.decorateMethod(Blast.Decorators.loopOverArgument(), function ignoreParameter(parameter) {
	parameter = parameter.toLowerCase();
	this.ignore_parameters.push(parameter);
});

/**
 * Add start urls
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String|RURL}   url
 */
Crawler.decorateMethod(Blast.Decorators.loopOverArgument(), function addStartUrl(url) {

	url = Blast.Classes.RURL.parse(url);

	this.start_urls.push(url);
});

/**
 * Is this extension allowed?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 */
Crawler.setMethod(function extensionIsAllowed(extension) {

	if (!this.ignore_extensions.length) {
		return true;
	}

	extension = extension.toLowerCase();

	if (extension[0] == '.') {
		extension = extension.slice(1);
	}

	if (this.ignore_extensions.indexOf(extension) > -1) {
		return false;
	}

	return true;
});

/**
 * Is this parameter allowed?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 */
Crawler.setMethod(function parameterIsAllowed(parameter) {

	if (!this.ignore_parameters.length) {
		return true;
	}

	parameter = parameter.toLowerCase();

	let entry,
	    i;

	for (i = 0; i < this.ignore_parameters.length; i++) {
		entry = this.ignore_parameters[i];

		if (typeof entry == 'string') {
			if (entry == parameter) {
				return false;
			}
		} else {
			// Regex
			if (entry.test(parameter)) {
				return false;
			}
		}

	}

	return true;
});

/**
 * Let the user add a custom function to check urls
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {Function}   fnc
 */
Crawler.setMethod(function addUrlCheck(fnc) {
	this.custom_url_checks.push(fnc);
});

/**
 * Is this url allowed?
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 * @param    {String}   text   Optional text/title of the link
 */
Crawler.setMethod(function isUrlAllowed(url, text) {

	// Make sure it's a valid Rurl object
	url = Blast.Classes.RURL.parse(url);

	let extension = url.extension;

	if (extension && !this.extensionIsAllowed(extension)) {
		return false;
	}

	let start_url,
	    allowed = false,
	    i;

	// Now check the start urls
	for (i = 0; i < this.start_urls.length; i++) {

		start_url = this.start_urls[i];

		// First make sure the hostname matches
		if (start_url.hostname == url.hostname) {

			// Then make sure the pathname matches (or is a child path)
			if (url.pathname.indexOf(start_url.pathname) > -1) {
				allowed = true;
				break;
			}
		}
	}

	if (allowed && this.custom_url_checks && this.custom_url_checks.length) {

		for (i = 0; i < this.custom_url_checks.length; i++) {
			allowed = this.custom_url_checks[i].call(this, url, text);

			if (!allowed) {
				break;
			}
		}
	}

	return allowed;
});

/**
 * Normalize the given url
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 */
Crawler.setMethod(function normalizeUrl(url) {

	// Make sure it's a valid Rurl object
	url = Blast.Classes.RURL.parse(url);

	if (this.ignore_parameters && this.ignore_parameters.length) {

		let params = Object.keys(url.query),
		    param,
		    i;

		for (i = 0; i < params.length; i++) {
			param = params[i];

			if (!this.parameterIsAllowed(param)) {
				url.param(param, null);
			}
		}
	}

	return url;
});

/**
 * Start crawling
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.2
 */
Crawler.setMethod(async function start(url, callback) {

	const that = this;

	let page;

	if (typeof url == 'function') {
		callback = url;
		url = null;
	}

	if (url) {
		url = Blast.Classes.RURL.parse(url);
		this.addStartUrl(url);
	} else {
		url = this.start_urls[0];
	}

	if (!callback) {
		callback = Fn.thrower;
	}

	callback = Fn.regulate(callback);

	// Calculate a new limit based on the delay
	let queue_limit = 4 * Math.ceil(0.5 + (this.render_delay / 1000));

	if (queue_limit < 2) {
		queue_limit = 2;
	}

	if (queue_limit > 10) {
		queue_limit = 10;
	}

	this.queue.limit = queue_limit;

	if (this.start_page) {
		return callback(new Error('Crawler has already started'));
	}

	if (this.start_urls.length) {
		// Create the start page
		this.start_page = page = this.browser.createTab();

		// Set the page's render timeout
		page.render_delay = this.render_delay;

		// Already go to the page
		await page.goto(url);

		this._crawlPage(page, 0, function done(err) {

			if (err) {
				return callback(err);
			}

			// Nothing is queued or running?
			if (!that.queue.running && !that.queue._queue.length) {
				return callback(null);
			}

			// Wait until the queue is empty
			that.queue.afterOnce('empty', function whenEmpty() {
				callback(null);
			});
		});
	} else {

		// If the queue is still empty, callback early
		if (!this.queue.running && !this.queue._queue.length) {
			return callback(null);
		}

		this.queue.afterOnce('empty', function whenEmpty() {
			callback(null);
		});
	}
});

/**
 * Get an identifier for a url
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 *
 * @return   {String}
 */
Crawler.setMethod(function getUrlIdentifier(url) {

	if (!url) {
		throw new Error('An invalid URL has been given');
	}

	if (typeof url == 'object') {
		url = url.href;
	}

	let identifier = url.replace('http://', '').replace('https://', '');

	if (identifier.indexOf('#') > -1) {
		identifier = Blast.Bound.String.before(identifier, '#');
	}

	return identifier;
});

/**
 * Get page info object
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 *
 * @return   {Object}
 */
Crawler.setMethod(function getPageInfo(url) {

	let identifier = this.getUrlIdentifier(url);

	if (!this.pages[identifier]) {
		this.pages[identifier] = {
			queued   : false,
			finished : false,
		};
	}

	return this.pages[identifier];
});

/**
 * Has the given url been queued or crawled already?
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 *
 * @return   {Boolean}
 */
Crawler.setMethod(function hasBeenQueued(url) {

	let info = this.getPageInfo(url);

	return info.finished || info.queued;
});

/**
 * Mark the given page as queued
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 */
Crawler.decorateMethod(Blast.Decorators.loopOverArgument(), function markQueued(url) {

	let info = this.getPageInfo(url);

	info.queued = true;
});

/**
 * Mark the given url as finished
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 */
Crawler.decorateMethod(Blast.Decorators.loopOverArgument(), function markFinished(url) {

	let info = this.getPageInfo(url);

	info.queued = false;
	info.finished = true;
});

/**
 * Queue the given link
 *
 * @author   Jelle De Loecker   <jelle@elevenways.be>
 * @since    0.1.2
 * @version  0.1.2
 *
 * @param    {String}   url
 */
Crawler.decorateMethod(Blast.Decorators.loopOverArgument(), function queueLink(url, level = 0) {

	if (this.hasBeenQueued(url)) {
		return;
	}

	const that = this,
	      pledge = new Blast.Classes.Pledge();

	// Make sure we don't queue this page multiple times
	that.markQueued(url);

	that.queue.add(function queueCrawl(release) {

		let next_page = that.browser.createTab();

		// Set the page's render delay
		next_page.render_delay = that.render_delay;

		next_page.start_url = url;

		// Release the lock once the tab closes
		next_page.afterOnce('closed', function afterClose() {
			release();
		});

		that._crawlPage(next_page, level + 1, function crawlIsDone(err) {

			release();

			if (err) {
				pledge.reject(err);
			} else {
				pledge.resolve();
			}
		});
	});

	return pledge;
});

/**
 * Actually get the links from a page
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.2
 *
 * @param    {Develry.Specter.Tab}   page
 */
Crawler.setMethod(async function _crawlPage(page, level, callback) {

	var that = this,
	    tasks = [];

	// Keep the page alive
	page.keep();

	// Close the tab when nothing is keeping it alive anymore
	page.afterOnce('released', function closeAfterRelease() {
		page.close();
	});

	function finish(err, result) {
		page.release();

		if (err) {
			return callback(err);
		}

		callback(null, result);
	}

	// Make sure the page/tab has been loaded
	if (!page.response_url) {
		if (!page.start_url) {
			return finish(new Error('Crawling candidate has no start url'));
		}

		try {
			await page.goto(page.start_url);
		} catch (err) {

			if (err.message.indexOf('net::ERR_ABORTED')) {
				// Probably a download!
				return finish(null);
			}

			console.log('Error:', err);
			// Ignore error
			return finish(null);
		}
	}

	// Store it without the protocol
	let identifier = this.getUrlIdentifier(page.start_url);

	// Make sure this page is marked as seen
	this.markQueued(page.start_url);

	// If a redirect happened, make sure it's marked as seen
	// & make sure it's actually allowed!
	if (page.start_url != page.response_url) {
		this.markQueued(page.response_url);

		// Make sure the response url is allowed
		if (!this.isUrlAllowed(page.response_url)) {
			return finish(null);
		}
	}

	console.log('Crawling', page, page.start_url, page.response_url)

	this.page_count++;

	page.on('error', function onError(err) {
		console.error('Got error on', page.start_url, err);
		finish(null);
	});

	page.links = [];

	page.getLinks(function gotLinks(err, result) {

		let start_url = that.normalizeUrl(page.start_url),
		    response_url = that.normalizeUrl(page.response_url);

		that.markFinished(start_url);
		that.markFinished(response_url);

		if (err) {
			// Emit this page
			that.emit('page', page);
			return finish(err);
		}

		// If we've reached the max level, stop now
		if (level == that.max_level) {
			// Emit this page
			that.emit('page', page);
			return finish(null);
		}

		let links = [];

		let queued_or_done = that.pages_queued_or_done,
		    title;

		for (let next_url in result.internal) {

			// Stop the crawler after 5000 pages
			if (queued_or_done > 5000) {
				break;
			}

			if (result.contents) {
				title = result.contents[next_url];
			} else {
				title = null;
			}

			next_url = that.normalizeUrl(next_url);

			// Make sure this url is allowed
			if (!that.isUrlAllowed(next_url, title)) {
				continue;
			}

			let queued_pledge = that.queueLink(next_url);

			if (!queued_pledge) {
				continue;
			}

			tasks.push(queued_pledge);

			links.push(next_url);
		}

		page.links = links;
		that.emit('page', page);

		// This page is no longer needed for specter
		page.release();

		Fn.parallel(tasks, callback);
	});
});
