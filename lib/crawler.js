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

	// The start url
	this.start_url = null;

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

	// Create a queue to prevent flooding a website
	this.queue = new Fn.createQueue({enabled: true, limit: 4});
});

/**
 * Start crawling
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.2
 */
Crawler.setMethod(async function start(url, callback) {

	var page;

	if (typeof url == 'function') {
		callback = url;
		url = null;
	}

	if (url) {
		this.start_url = url;
	} else {
		url = this.start_url;
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

	if (this.start_url) {
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

			callback(null);
		});
	} else {

		// If the queue is still empty, callback early
		if (!this.queue.running && !this.queue._queue.length) {
			return callback(null);
		}

		this.queue.once('empty', function whenEmpty() {
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

	// Make sure the page/tab has been loaded
	if (!page.response_url) {
		if (!page.start_url) {
			throw new Error('Crawling candidate has no start url');
		}

		try {
			await page.goto(page.start_url);
		} catch (err) {
			console.log('Failed to get ' + page.start_url, err);
			return callback(null);
		}
	}

	// Store it without the protocol
	let identifier = this.getUrlIdentifier(page.start_url);

	// Make sure this page is marked as seen
	this.markQueued(page.start_url);

	if (page.start_url != page.response_url) {
		this.markQueued(page.response_url);

		let start = Blast.Classes.RURL.parse(page.start_url),
		    response_url = Blast.Classes.RURL.parse(page.response_url);

		// If the hostname changed due to a redirect, ignore this!
		if (start.hostname != response_url.hostname) {
			return callback(null);
		}
	}

	this.page_count++;

	// Keep the page alive
	page.keep();

	page.on('error', function onError(err) {
		console.error('Got error on', page.start_url, err);
		callback(null);
	});

	page.links = [];

	// Close the tab is nothing is keeping it alive anymore
	page.afterOnce('released', function closeAfterRelease() {
		page.close();
	});

	page.getLinks(function gotLinks(err, result) {

		that.markFinished(page.start_url);
		that.markFinished(page.response_url);

		if (err) {
			// Emit this page
			that.emit('page', page);
			return callback(err);
		}

		// If we've reached the max level, stop now
		if (level == that.max_level) {
			// Emit this page
			that.emit('page', page);
			return callback(null);
		}

		let links = [];

		for (let next_url in result.internal) {

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
