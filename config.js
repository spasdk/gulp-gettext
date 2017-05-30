/**
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var path     = require('path'),
    extend   = require('extend'),
    config   = require('spa-plugin/config'),
    profiles = {};


// main
profiles.default = extend(true, {}, config, {
    // main entry point
    source: path.join(config.source, 'lang'),

    // intended output file
    target: path.join(config.target, 'lang'),

    // javascript source file
    jsData: path.join(config.target, 'js', 'develop.js'),

    // list of language codes in ISO 639-1 format to generate localization files for
    languages: [],

    // Specifies the encoding of the input files.
    // This option is needed only if some untranslated message strings or their corresponding comments
    // contain non-ASCII characters.
    // @flag --from-code=name
    fromCode: 'UTF-8',

    // Place comment blocks starting with tag and preceding keyword lines in the output file.
    // Without a tag, the option means to put all comment blocks preceding keyword lines in the output file.
    // Note that comment blocks supposed to be extracted must be adjacent to keyword lines.
    // @flag --add-comments[=tag]
    addComments: 'gettext',

    // Write the .po file using indented style.
    // @flag --indent
    indent: false,

    // Write "#: filename:line" lines.
    // @flag --no-location
    noLocation: true,

    // Do not break long message lines.
    // Message lines whose width exceeds the output page width will not be split into several lines.
    // Only file reference lines which are wider than the output page width will be split.
    // @flag --no-wrap
    noWrap: true,

    // Generate sorted output.
    // Note that using this option makes it much harder for the translator to understand each message’s context.
    // @flag --sort-output
    sortOutput: true,

    // Sort output by file location.
    // @flag --sort-by-file
    sortByFile: false,

    // Increase verbosity level.
    // @flag --verbose
    verbose: false,

    notifications: {
        popup: {
            info: {icon: path.join(__dirname, 'media', 'info.png')},
            warn: {icon: path.join(__dirname, 'media', 'warn.png')},
            fail: {icon: path.join(__dirname, 'media', 'fail.png')}
        }
    }
});


// public
module.exports = profiles;
