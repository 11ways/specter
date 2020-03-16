var Blast = __Protoblast,
    Fn    = Blast.Bound.Function;

// Get the Specter namespace
Specter = Fn.getNamespace('Develry.Specter');

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

	// Page queue
	this.page_queue = Fn.createQueue({limit: 10});

	Browser.instances.push(this);
});

/**
 * All open instances
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setStatic('instances', []);

/**
 * Destroy all instances
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Browser.setStatic(function destroyAll() {

	var i;

	console.error('Closing all Specter browsers...');

	for (i = Browser.instances.length - 1; i >= 0; i--) {
		Browser.instances[i].destroy();
	}
});

/**
 * The browser interface
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @type    {Develry.Specter.Interface.Browser}
 */
Browser.prepareProperty(function interface() {

	var interface_type,
	    instance;

	if (this.options.interface_type) {
		interface_type = this.options.interface_type;
	} else {
		interface_type = 'Puppeteer';
	}

	if (!Specter.Interface[interface_type]) {
		throw new Error('Interface type "' + interface_type + '" was not found');
	}

	instance = new Specter.Interface[interface_type].Browser(this);

	return instance;
});

/**
 * Create a new tab
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {Specter.Tab}
 */
Browser.setMethod(function createTab() {

	var interface,
	    tab;

	// First create an interface
	interface = this.interface.createTabInterface();

	// Create the tab class
	tab = new Specter.Tab(this, interface);

	return tab;
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

	id = Browser.instances.indexOf(this);

	if (id > -1) {
		Browser.instances.splice(id, 1);
	}

	let pledge = Blast.Classes.Pledge.cast(this.interface.destroy());

	pledge.done(callback);

	return pledge;
});

process.on('exit', function onExit() {
	Browser.destroyAll();
});

process.on('SIGINT', function onSigint() {
	Browser.destroyAll();
});