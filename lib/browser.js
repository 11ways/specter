var instances       = [],
    phantom         = require('phantom'),
    Blast           = __Protoblast,
    Fn              = Blast.Bound.Function;

// Get the Sentana namespace
Specter = Blast.Bound.Function.getNamespace('Develry.Specter');

/**
 * The Specter Browser Class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
var Browser = Fn.inherits('Informer', 'Develry.Specter', function Browser(options) {

	var that = this;

	// Browser options
	this.options = options || {};

	// Main instance
	this.instance = null;

	// Page queue
	this.page_queue = Fn.createQueue({limit: 10});

	phantom.create(['--disk-cache=true']).then(function gotInstance(instance) {
		that.instance = instance;
		that.emit('ready');
		that.page_queue.start();
	}).catch(function gotError(err) {
		that.emit('error', err);
	});

	instances.push(this);
});

/**
 * Destroy all instances
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setStatic(function destroyAll() {
	var i;

	for (i = instances.length - 1; i >= 0; i--) {
		instances[i].instance.kill();
	}
});

/**
 * Request a free page instance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setMethod(function requestPageInstance(callback) {

	var that = this;

	this.page_queue.add(function getPageInstance(done) {
		that.instance.createPage().then(function gotPageInstance(instance) {
			callback(null, instance, done);
		}).catch(function gotError(err) {
			callback(err);
			done();
		});
	});
});

/**
 * Open a new page
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   url
 *
 * @return   {Specter.Page}
 */
Browser.setMethod(function openPage(url, callback) {

	var page = new Specter.Page(this);

	if (url) {
		page.openUrl(url, callback);
	}

	return page;
});

/**
 * Create a crawler
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   url
 *
 * @return   {Specter.Crawler}
 */
Browser.setMethod(function createCrawler(url) {
	var crawler;

	crawler = new Specter.Crawler(this);

	if (url) {
		crawler.start_url = url;
	}

	return crawler;
});

/**
 * Destroy the browser
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setMethod(function destroy(callback) {

	var id;

	if (!callback) {
		callback = Fn.thrower;
	}

	id = instances.indexOf(this);

	if (id > -1) {
		instances.splice(id, 1);
	}

	this.instance.exit(callback);
});

process.on('exit', function onExit() {
	Browser.destroyAll();
});

process.on('SIGINT', function onSigint() {
	Browser.destroyAll();
});