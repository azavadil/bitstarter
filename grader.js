#!/usr/bin/env node

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/





var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler'); 

//var argv = require('optimist').argv;



var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "undefined";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    /* note: if the encoding option is specified the fs.readFileSync returns a string
     * otherwise fs.readFileSync returns a buffer
     * This would seem to return a buffer
     * I'm unclear why this isn't set to return a string
     */

    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioUrlFile = function(urlString) { 
    return cheerio.load(urlString); 
}




var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkUrlFile = function(urlfile, checksfile) {
    $ = cheerioUrlFile(urlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};


/* assertURLExists
 * ---------------
 * assertURLExists works in conjunction with the commander library 
 * and validates the url before proceeding. 
 * 
 * If restler can queries the url without error then assertURLExists
 * returns the url
 */ 


var assertURLExists = function(inputURL) {
    console.log("assertURLExists = " + inputURL); 
    rest.get(inputURL).on('complete', function(result) {
        if(result instanceof Error) {
            console.log("%s does not exist. Exiting.", inputURL);
            process.exit(1);
         } else { 
	     var checkJson = checkUrlFile(result, program.checks);
	     var outJson = JSON.stringify(checkJson, null, 4);
	     console.log(outJson);
	 }
    });
}




var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};



/* Implementation notes 
 * --------------------
 * the .option() code is part of the commander library for parsing command line arguments
 * 
 * the first argument (e.g. '-c, --checks <check_file>') is the short and long form of the flag 
 * e.g. -c is the short form of the flag, --checks is the long form of the flag
 * if < > or [ ] is included, that specifies that an argument is to be passed along with the flag
 * < > is a required argument, [ ] is an optional argument 
 * 
 * The next paramenter is just a descriptive message 
 * 
 * I'm not sure what the the clone 'workaround' is. Clone is copying and returning the callback function
 * I'm not sure if that's because we need a copy of the callback or because we need a return instead of a reference
 *
 * If an argument isn't specified and there's no default value, then it's undefined (how does commander discern
 * the default arguments? 
 * 
 * If an argument is specified and there's no default value, then we get true    
 */



if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url_file>', 'Path to url', clone(assertURLExists))
        .parse(process.argv);

   

    /* if the command line argument is --url
     * if there is no default specified by the option then we false when that option is not used
     * the case where a url is specified is handled by the callback
     */ 

   if(!program.url) { //the command line argument was --file
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    } 
    
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
