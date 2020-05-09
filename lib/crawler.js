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
 * @version  0.1.0
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

	// Links and their pages
	this.pages = {};

	// Total amount of crawled pages
	this.page_count = 0;
});

/**
 * Start crawling
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
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

	if (!this.start_url) {
		return callback(new Error('No start url has been given'));
	}

	if (this.start_page) {
		return callback(new Error('Crawler has already started'));
	}

	// Create the start page
	this.start_page = page = this.browser.createTab();

	// Already go to the page
	await page.goto(url);

	this._crawlPage(page, 0, function done(err) {

		if (err) {
			return callback(err);
		}

		callback(null);
	});
});

/**
 * Actually get the links from a page
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
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
			console.log('Failed to get ' + page.start_url);
			return callback(null);
		}
	}

	// Store it without the protocol
	let identifier = page.start_url.replace('http://', '').replace('https://', '');

	// Store the page under the original and the final url
	this.pages[identifier] = page;

	if (page.start_url != page.response_url) {
		let second_identifier = page.response_url.replace('http://', '').replace('https://', '');
		this.pages[second_identifier] = page;
	}

	this.page_count++;

	page.on('error', function onError(err) {
		console.error('Got error on', page.start_url, err);
		callback(null);
	})

	page.getLinks(function gotLinks(err, result) {

		// Emit this page
		that.emit('page', page);

		if (err) {
			return callback(err);
		}

		// If we've reached the max level, stop now
		if (level == that.max_level) {
			return callback(null);
		}

		for (let next_url in result.internal) {

			let next_identifier = next_url.replace('http://', '').replace('https://', '');

			// If the url has already been seen, skip it
			if (that.pages[next_identifier]) {
				continue;
			}

			// Set a temporary boolean here, so we don't
			// queue this page multiple times
			that.pages[next_identifier] = true;

			tasks.push(function crawlPage(next) {

				let next_page = that.browser.createTab();

				next_page.start_url = next_url;

				that._crawlPage(next_page, level + 1, next);
			});
		}

		// Run maximum 8 tasks in parallel
		// (Specter has its own limits, too)
		Fn.parallel(8, tasks, callback);
	});
});
