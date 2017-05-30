/**
 * Arguments description:      https://www.gnu.org/software/gettext/manual/html_node/xgettext-Invocation.html
 * Header entries description: https://www.gnu.org/software/gettext/manual/html_node/Header-Entry.html
 * Plural-forms parameter:     https://www.gnu.org/software/gettext/manual/html_node/Plural-forms.html
 *
 * @author Stanislav Kalashnik <darkpark.main@gmail.com>
 * @license GNU GENERAL PUBLIC LICENSE Version 3
 */

'use strict';

var PluginTemplate = require('spa-plugin'),
    util = require('util'),
    fs   = require('fs'),
    path = require('path'),
    exec = require('child_process').exec,
    load = require('require-nocache')(module);


/**
 * @constructor
 * @extends PluginTemplate
 *
 * @param {Object} config init parameters (all inherited from the parent)
 */
function Plugin ( config ) {
    var self = this;

    // parent constructor call
    PluginTemplate.call(this, config);

    // create tasks for profiles
    this.profiles.forEach(function ( profile ) {
        // main entry task
        profile.task(self.entry, function ( done ) {
            function po2js ( config, poFile, jsonFile ) {
                var jsonDir  = config.target,
                    po       = require('gettext-parser').po.parse(fs.readFileSync(poFile, {encoding: 'utf8'})),
                    contexts = po.translations,
                    result   = {
                        meta: {
                            charset:  po.charset,
                            project:  po.headers['project-id-version'],
                            language: po.headers.language,
                            plural:   ''
                        },
                        data: {}
                    };

                if ( po.headers['plural-forms'] ) {
                    result.meta.plural = po.headers['plural-forms'].split('plural=').pop().replace(';', '');
                }

                // fill items
                Object.keys(contexts).sort().forEach(function ( contextName ) {
                    result.data[contextName] = result.data[contextName] || {};

                    Object.keys(contexts[contextName]).sort().forEach(function ( msgId ) {
                        if ( msgId ) {
                            if ( contexts[contextName][msgId].msgid_plural ) {
                                result.data[contextName][msgId] = contexts[contextName][msgId].msgstr;
                            } else {
                                result.data[contextName][msgId] = contexts[contextName][msgId].msgstr[0];
                            }
                        }
                    });

                });

                if ( !fs.existsSync(jsonDir) ) {
                    fs.mkdirSync(jsonDir);
                }

                // store js file
                fs.writeFileSync(jsonFile, JSON.stringify(result, null, '\t'), {encoding: 'utf8'});

                return result;
            }


            function msginit ( config, langName, potFile, poFile, callback ) {
                var title  = 'msginit ',
                    params = [
                        'msginit',
                        '--input="'  + potFile  + '"',
                        '--output="' + poFile   + '"',
                        '--locale="' + langName + '"',
                        '--no-translator'
                    ],
                    command;

                // optional flags
                if ( config.noWrap ) { params.push('--no-wrap'); }

                // final exec line
                command = params.join(' ');

                exec(command, function ( error, stdout, stderr ) {
                    if ( error ) {
                        profile.notify({
                            info: error.toString().trim(),
                            type: 'fail',
                            tags: [self.entry, title],
                            data: {command: command}
                        });
                    } else {
                        (stdout + stderr).trim().split('\n').forEach(function ( line ) {
                            console.log(title, line);
                        });

                        // Content-Type: text/plain; charset=UTF-8
                        fs.writeFileSync(poFile,
                            fs.readFileSync(poFile, {encoding: 'utf8'}).replace(
                                'Content-Type: text/plain; charset=ASCII',
                                'Content-Type: text/plain; charset=UTF-8'
                            )
                        );
                    }

                    callback(error);
                });
            }


            function msgmerge ( config, langName, potFile, poFile, callback ) {
                var title    = 'msgmerge',
                    msgmerge = [
                        'msgmerge',
                        '--update',
                        '--verbose'
                    ],
                    command;

                // optional flags
                if ( config.indent     ) { msgmerge.push('--indent'); }
                if ( config.noLocation ) { msgmerge.push('--no-location'); }
                if ( config.noWrap     ) { msgmerge.push('--no-wrap'); }
                if ( config.sortOutput ) { msgmerge.push('--sort-output'); }
                if ( config.sortByFile ) { msgmerge.push('--sort-by-file'); }

                // merge
                msgmerge.push(poFile);
                msgmerge.push(potFile);

                // final exec line
                command = msgmerge.join(' ');

                if ( config.verbose ) {
                    console.log(title, command);
                }

                exec(command, function ( error, stdout, stderr ) {
                    /* eslint no-unused-vars: 0 */

                    if ( error ) {
                        profile.notify({
                            info: error.toString().trim(),
                            type: 'fail',
                            tags: [self.entry, title],
                            data: {command: command}
                        });
                    } else {
                        profile.notify({
                            info: stderr.trim().split('\n')[1],
                            tags: [self.entry, title, langName],
                            data: {command: command}
                        });
                    }

                    callback(error);
                });
            }


            function xgettext ( config, callback ) {
                var dstFile = path.join(config.source, 'messages.pot'),
                    pkgInfo = load(path.join(process.cwd(), 'package.json')),
                    title   = 'xgettext',
                    params  = [
                        'xgettext',
                        '--force-po',
                        '--output="' + dstFile + '"',
                        '--language="JavaScript"',
                        '--from-code="' + config.fromCode + '"',
                        '--package-name="' + pkgInfo.name + '"',
                        '--package-version="' + pkgInfo.version + '"',
                        '--msgid-bugs-address="' + (pkgInfo.author.email ? pkgInfo.author.email : pkgInfo.author) + '"'
                    ],
                    command;

                // optional flags
                if ( config.indent      ) { params.push('--indent'); }
                if ( config.noLocation  ) { params.push('--no-location'); }
                if ( config.noWrap      ) { params.push('--no-wrap'); }
                if ( config.sortOutput  ) { params.push('--sort-output'); }
                if ( config.sortByFile  ) { params.push('--sort-by-file'); }
                if ( config.addComments ) { params.push('--add-comments="' + config.addComments + '"'); }

                // input file
                params.push(config.jsData);

                // final exec line
                command = params.join(' ');

                exec(command, function ( error, stdout, stderr ) {
                    if ( error ) {
                        profile.notify({
                            info: error.toString().trim(),
                            type: 'fail',
                            tags: [self.entry, title],
                            data: {command: command}
                        });

                        callback(error);

                        return;
                    }

                    if ( stdout ) {
                        stdout.trim().split('\n').forEach(function ( line ) {
                            console.log(title, line);
                        });
                    }

                    if ( stderr ) {
                        stderr.trim().split('\n').forEach(function ( line ) {
                            console.log(title, line);
                        });
                    }

                    profile.notify({
                        info: 'write ' + dstFile,
                        tags: [self.entry, title],
                        data: {command: command}
                    });

                    callback(error, dstFile);
                });
            }

            xgettext(profile.data, function ( error, potFile ) {
                var runCount = 0,
                    fnDone   = function ( poFile, jsonFile ) {
                        runCount++;

                        po2js(profile.data, poFile, jsonFile);

                        if ( runCount >= profile.data.languages.length ) {
                            done();
                        }
                    };

                if ( error ) {
                    done();

                    return;
                }

                profile.data.languages.forEach(function ( langName ) {
                    var poFile   = path.join(profile.data.source, langName + '.po'),
                        jsonFile = path.join(profile.data.target, langName + '.json');

                    if ( fs.existsSync(poFile) ) {
                        // merge existing pot and po files
                        msgmerge(profile.data, langName, potFile, poFile, function () {
                            fnDone(poFile, jsonFile);
                        });
                    } else {
                        // create a new lang file
                        msginit(profile.data, langName, potFile, poFile, function () {
                            fnDone(poFile, jsonFile);
                        });
                    }
                });
            });
        });
    });

    this.debug('tasks: ' + Object.keys(this.tasks).sort().join(', '));
}


// inheritance
Plugin.prototype = Object.create(PluginTemplate.prototype);
Plugin.prototype.constructor = Plugin;


// public
module.exports = Plugin;
