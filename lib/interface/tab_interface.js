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
 * @param    {Develry.Specter.Interface.Browser}   browser
 */
var TabInterface = Fn.inherits('Informer', 'Develry.Specter.Interface', function Tab(browser_interface) {
	this.browser_interface = browser_interface;
	this.init();
});