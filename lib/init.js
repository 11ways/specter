var fs = require('fs'),
    libpath = require('path'),
    Sentana,
    files,
    Blast,
    file,
    i;

// Get an existing Protoblast instance,
// or create a new one
if (typeof __Protoblast != 'undefined') {
	Blast = __Protoblast;
} else {
	Blast = require('protoblast')(false);
}

// Get the Sentana namespace
Specter = Blast.Bound.Function.getNamespace('Develry.Specter');

// Require the main files
require('./browser.js');
require('./page.js');

// Export the entire Sentana namespace
module.exports = Specter;