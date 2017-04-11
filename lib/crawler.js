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
Crawler.setMethod(function start(url, callback) {

	var page;

	if (typeof url == 'function') {
		callback = url;
		url = null;
	}

	if (url) {
		this.start_url = url;
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
	this.start_page = page = this.browser.openPage(this.start_url);

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
 * @param    {Develry.Specter.Page}   page
 */
Crawler.setMethod(function _crawlPage(page, level, callback) {

	var that = this,
	    tasks = [];

	// Store the page under the original and the final url
	this.pages[page.start_url] = page;

	if (page.start_url != page.response_url) {
		this.pages[page.response_url] = page;
	}

	this.page_count++;

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

		log.info('Iterating over links:', result);

		for (let next_url in result.internal) {

			// If the url has already been seen, skip it
			if (that.pages[next_url]) {
				continue;
			}

			tasks.push(function crawlPage(next) {

				var next_page;

				next_page = that.browser.openPage(next_url);

				that._crawlPage(next_page, level + 1, next);
			});
		}

		// Run maximum 8 tasks in parallel
		// (Specter has its own limits, too)
		Function.parallel(8, tasks, callback);
	});
});
