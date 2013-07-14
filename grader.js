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
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var checkCheerio = function(cheerio, checksfile) {
	var checks = (JSON.parse(fs.readFileSync(checksfile))).sort();
    var out = {};
    for(var ii in checks) {
        var present = cheerio(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
}

var checkHtmlFile = function(htmlfile, checksfile) {
	$ = cheerio.load(fs.readFileSync(htmlfile));
    return checkCheerio($, checksfile);
};

var checkHtmlBuffer = function(htmlbuffer, checksfile) {
    $ = cheerio.load(htmlbuffer);
    return checkCheerio($, checksfile);
};

var getOnURLGetComplete = function(checksfile) {
	var onURLGetComplete = function(result, response) {
		var checkJson = checkHtmlBuffer(result, checksfile);	
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
	};
	return onURLGetComplete;
}

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
		.option('-u, --url <URL>', 'Path to url')
        .parse(process.argv);
		
	if (program.url != undefined) {
		// from URL
		rest.get(program.url).on('complete', getOnURLGetComplete(program.checks));
		//console.log(program.url);
	} else if (program.file != undefined) {
		// from html file in the disk
		var checkJson = checkHtmlFile(program.file, program.checks);
		var outJson = JSON.stringify(checkJson, null, 4);
		console.log(outJson);
		//console.log(program.file);
	}
	
    //var checkJson = checkHtmlFile(program.file, program.checks);
	//rest.get(program.url).on('complete', getOnURLGetComplete(program.checks));
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
