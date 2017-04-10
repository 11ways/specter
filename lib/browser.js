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

	phantom.create().then(function gotInstance(instance) {
		that.instance = instance;
		that.emit('ready');
	}).catch(function gotError(err) {
		that.emit('error', err);
	});
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
		instances[i].instance.destroy();
	}
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

	console.log('EXITING', this.instance);

	this.instance.exit(callback);
});

process.on('exit', function onExit() {
	Browser.destroyAll();
});

process.on('SIGINT', function onSigint() {
	Browser.destroyAll();
});