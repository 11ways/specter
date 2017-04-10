var Blast           = __Protoblast,
    Fn              = Blast.Bound.Function,
    callback_id     = Date.now();

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
var Page = Fn.inherits('Informer', 'Develry.Specter', function Page(browser) {

	var that = this;

	// The main browser instance
	this.browser = browser;

	// Main page instance
	this.instance = null;

	// The amount of redirects
	this.redirects = 0;

	// The basic auth to use?
	this.basic_auth = '';

	// The url we ended up on
	this.response_url = null;

	// The final status
	this.response_status = 0;

	// Timestamp when this page request started
	this.page_start = null;

	// How long it took to get the html
	this.page_response_duration = null;

	// How long it took to get the complete page
	this.page_load_duration = null;

	// Have we received the page html yet?
	this.got_html = false;

	// Number of request counts
	this.request_count = 0;

	// Number of responses
	this.response_count = 0;

	// All requests on this page
	this.requests = {};

	// Callbacks for asynchronous javascript calls are kept here
	this.callbacks = {};

	this.init();
});

/**
 * Init this instance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function init() {

	if (this._inited) {
		return;
	}

	let that = this;
	this._inited = true;

	this.browser.afterOnce('ready', function afterReady() {
		that.browser.instance.createPage().then(function gotPageInstance(instance) {
			console.log('Got page:', instance);
			that.instance = instance;
			that.addPageListeners();
			that.emit('ready');
		}).catch(function gotError(err) {
			that.emit('error', err);
		});
	});
});

/**
 * Make a URL
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function makeUrl(url) {

	var protocol = url.before('://'),
	    path = url.after('://'),
	    result;

	result = protocol + '://';

	if (this.basic_auth) {
		result += this.basic_auth + '@';
	}

	result += path;

	return result;
});

/**
 * Add page listeners
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function addPageListeners() {

	var that = this;

	// Set the window size
	this.instance.property('viewportSize', {width:1680, height:1050});

	this.instance.setting('userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.81 Safari/537.36');

	// Moniter requested resources
	this.instance.on('onResourceRequested', function onRequest(request, networkRequest) {

		that.request_count += 1;

		// Start counting from the first request, which is the page itself
		if (that.request_count == 1) {
			that.page_start = Date.now();
		}

		that.requests[request.url] = {
			request  : request,
			response : false,
			start    : Date.now()
		};
	});

	// Listen to the network activity
	this.instance.on('onResourceReceived', function onResource(response) {

		var req = that.requests[response.url];

		that.response_count += 1;

		// Calculate the time it took to get this request
		req.end = Date.now();
		req.duration = req.end - req.start;

		if (!that.got_html) {
			// Is this the request we're expecting html from?
			if (that.response_url == response.url || (that.response_url + '/') == response.url) {

				// We're being redirected!
				if (response.redirectURL) {
					that.redirects += 1;
					that.response_url = response.redirectURL;
				} else {
					that.got_html = true;
					that.page_response_duration = Date.now() - that.page_start;
					that.response_status = response.status;

					// Got HTML, but it isn't loaded yet
					that.emit('got_html');
				}
			}

			return;
		}
	});

	// Listen to callbacks
	this.instance.on('onCallback', function onCallback(data) {

		console.log('Received callback:', data);

		if (!data) {
			return;
		}

		if (typeof data == 'string') {
			return that.emit('unknown_callback', data);
		}

		if (data.event) {

			if (!data.args) {
				data.args = [];
			}

			return that.emit(data.event, ...data.args);
		}

		if (that.callbacks[data.id]) {
			that.callbacks[data.id](...data.args);
		}
	});

	// Listen for the load finished event
	this.instance.on('onLoadFinished', function onFinished(status) {
		console.log('Some load finished:', status);
	});

	this.instance.on('onInitialized', function() {
		that.instance.evaluate(function() {
			document.addEventListener('DOMContentLoaded', function() {
				window.callPhantom({event: 'DOMContentLoaded'})
			}, false);
		});
	});

	this.afterOnce('DOMContentLoaded', function domLoaded() {
		that.emit('loaded');
	});
});

/**
 * Perform given callback on instance
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function exec(method, args, callback) {

	var that = this;

	if (!callback) {
		callback = Fn.thrower;
	}

	if (!method) {
		return callback(new Error('No valid method name given!'));
	}

	if (!Array.isArray(args)) {
		args = [args];
	}

	this.afterOnce('ready', function afterReady() {

		// This check needs to happen after the ready event,
		// because instance is null before it
		if (typeof that.instance[method] !== 'function') {
			return callback(new Error('The requested method "' + method + '" does not exist on the Phantom Page instance'));
		}

		that.instance[method](...args).then(function done(...result) {
			callback(null, ...result);
		}).catch(function onError(err) {
			callback(err);
		});
	});
});

/**
 * Perform given callback on instance once the page has loaded
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function execLoaded(...args) {

	var that = this;

	this.afterOnce('loaded', function afterLoaded() {
		that.exec(...args);
	});
});

/**
 * Open given location
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {String}   url
 */
Page.setMethod(function openUrl(url, callback) {

	var that = this;

	if (this.response_url) {
		return callback(new Error('Page is already loading something else'));
	}

	// Indicate this is the url we're expecting
	this.response_url = url;

	this.exec('open', [url], function gotStatus(err, status) {

		if (err) {
			return callback(err);
		}

		that.afterOnce('loaded', function loaded() {

			that.page_load_duration = Date.now() - that.page_start;

			console.log('Page has loaded in', that.page_load_duration / 1000, 'seconds');

			//that.emit('loaded');
			callback(null, status);
		});
	});
});

/**
 * Get all links on the page
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function getLinks(callback) {

	var that = this;

	this.evaluate(function() {

		var elements,
		    external = {},
		    element,
		    anchors  = {},
		    unique   = 0,
		    total    = 0,
		    href,
		    url,
		    str      = '',
		    i;

		// Get all the elements
		elements = document.querySelectorAll('a[href]');

		for (i = 0; i < elements.length; i++) {
			element = elements[i];

			href = element.getAttribute('href');
			url = element.href;

			if (href[0] == '#') {
				return;
			}

			if (element.host !== location.host) {

				if (!external[url]) {
					external[url] = 0;
				}

				external[url]++;

				return;
			}

			total += 1;

			if (!anchors[url]) {
				anchors[url] = 0;
				unique += 1;
			}

			anchors[url]++;
		};

		return {
			anchors  : anchors,
			total    : total,
			unique   : unique,
			external : external
		};
	}, function gotLinks(result) {

		that.links = result;

		if (callback) callback(null, result);
	});

});

/**
 * Evaluate some javascript on the page
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function evaluate(code, callback) {

	var method;

	if (typeof code == 'string') {
		method = 'evaluateJavaScript';
		code = code.trim();
		code = 'function(){ ' + code + '; return true;}';
	} else {
		return this._evaluateJs(code, callback);
	}

	this.execLoaded(method, [code], callback);
});

/**
 * Evaluate javascript function on the page
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 */
Page.setMethod(function _evaluateJs(fnc, callback) {

	if (!callback) {
		callback = Fn.thrower;
	}

	// If the function has no callbacks, use the regular method
	if (!fnc.length) {
		return this.execLoaded('evaluate', [fnc], callback);
	}

	let code,
	    done,
	    body,
	    name,
	    id;

	id = callback_id++;
	this.callbacks[id] = callback;

	name = getParamNames(fnc)[0];
	body = Fn.getBodySource(fnc);

	code = `function() {
		var ${name} = function doCallback() {
			var args = Array.prototype.slice.call(arguments);
			window.callPhantom({id: ${id}, args: args, duration: Date.now() - _start});
		};

		var _start = Date.now();

		return (function() {
			${body}
		}());
	}`;

	this.execLoaded('evaluateJavaScript', [code]);
});

var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
var ARGUMENT_NAMES = /([^\s,]+)/g;

function getParamNames(func) {
	var fnStr = func.toString().replace(STRIP_COMMENTS, '');
	var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);

	if (result === null) {
		result = [];
	}

	return result;
}