var Specter,
    Blast  = __Protoblast,
    Fn     = Blast.Bound.Function;

// Get the Specter namespace
var Specter = Fn.getNamespace('Develry.Specter');

/**
 * The abstract Browser Interface Class
 *
 * @constructor
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @param    {Develry.Specter.Browser}   browser
 */
var BrowserInterface = Fn.inherits('Informer', 'Develry.Specter.Interface', function Browser(browser) {
	this.browser = browser;
	this.init();
});

/**
 * Create a new tab interface
 *
 * @author   Jelle De Loecker   <jelle@develry.be>
 * @since    0.1.0
 * @version  0.1.0
 *
 * @return   {Develry.Specter.Interface.Tab}
 */
BrowserInterface.setMethod(function createTabInterface() {

	// Get the namespace object this class is in
	var Namespace = Fn.getNamespace(this.constructor.namespace),
	    instance;

	// And return a new instance of the Tab class
	instance = new Namespace.Tab(this);

	return instance;
});