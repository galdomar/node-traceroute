'use strict';


const Child = require('child_process');
const Dns = require('dns');
const EventEmitter = require('events');
const Net = require('net');
const Os = require('os');
const Util = require('util');
const console = require('winston');
console.remove(console.transports.Console);

const internals = {};


internals.isWin = /^win/.test(Os.platform());


module.exports = internals.Traceroute = {};


internals.Traceroute.trace = function (host, options, callback) {

    let options_default = {
        maxhops: undefined
    }
    options = options || {};
    options = Object.assign(options_default, options);
    const Emitter = function () {
        EventEmitter.call(this);
    };
    Util.inherits(Emitter, EventEmitter);
    const emitter = new Emitter();

    Dns.lookup(host.toUpperCase(), (err) => {

        if (err && Net.isIP(host) === 0) {
            return callback(new Error('Invalid host'));
        }

        const command = (internals.isWin ? 'tracert' : 'traceroute');
        let args;
        if (options.maxhops === undefined) {
            args = internals.isWin ? ['-d', host] : ['-q', 1, '-n', host];
        } else {
            args = internals.isWin ? ['-h', options.maxhops, '-d', host] : ['-m', options.maxhops, '-q', 1, '-n', host];
        }
        
        console.info('LAUNCH: ' + command + ' ' + args);
        const traceroute = Child.spawn(command, args);

        const hops = [];
        let counter = 0;
        let lineEmitted = '';
        traceroute.stdout.on('data', (data) => {

            let lines;
            lineEmitted += data;
            if (data.indexOf("\n") === -1) {
               return null;
            } else {
                let newLineEmitted = '';
                let lastSeparator = lineEmitted.lastIndexOf('\n');
                console.log('lastSeparator: ' + lastSeparator);
                console.log('lineEmitted.length: ' + lineEmitted.length);
                if (lastSeparator  !== lineEmitted.length - 1) {
                    newLineEmitted = lineEmitted.substring(lastSeparator);
                    lineEmitted = lineEmitted.substring(0, lastSeparator);
                }
               //data = lineEmitted; 
               lines = lineEmitted.split('\n');
               lineEmitted = newLineEmitted;
            }
            console.log('lineemitted: ', lineEmitted);
            console.log(lines);
            lines.forEach(function(element) {
                ++counter;
                if ((!internals.isWin && counter < 1) || (internals.isWin && counter < 4)) {
                    return null;
                }
    
                const result = element.toString().replace(/\n$/,'');
                if (!result) {
                    return null;
                }
    
                console.log('RESULT: ' + result);
                const hop = internals.parseHop(result);
                if (hop && (hop !== false)) {
                    console.log(hop);
                    hops.push(hop);
                    emitter.emit('hop', hop);     
                }
            }, this);
        });

        traceroute.on('close', (code) => {

            if (callback) {
                callback(null, hops);
            }

            emitter.emit('done', hops);
        });
    });
    
    return emitter;
};


internals.parseHop = function (hop) {

    console.log('parseHop->');
    console.log(hop);
    let line = hop.replace(/\*/g,'0');

    if (internals.isWin) {
        line = line.replace(/\</g,'');
    }

    const s = line.split(' ');
    for (let i = s.length - 1; i > -1; --i) {
        if (s[i] === '' || s[i] === 'ms') {
            s.splice(i,1);
        }
    }

    return internals.isWin ? internals.parseHopWin(s) : internals.parseHopNix(s);
};


internals.parseHopWin = function (line) {

    console.log('parseHopWin->');
    console.log(line);
    // if (line[4] === 'Request') {
    //     return false;
    // }
    if (line[0] === '\r') {
        return false;
    }    
    if (line[0] === 'Trace') {
        return false;
    }
    const hop = {};
    if ((line[1] === '0') && (line[2] === '0') && (line[3] === '0')) {
        hop['Request timed out'] = [+line[1], +line[2], +line[3]];
    } else {
        hop[String(line[4])] = [+line[1], +line[2], +line[3]];
    }

    console.log(hop);
    return hop;
};


internals.parseHopNix = function (line) {

    let hop = {};

    if (line[1] === '0') {
        hop['Request timed out'] = [+line[1], +line[1], +line[1]];
       return hop;
    }

    if (line[0] === 'traceroute') {
        return false;
    }

    let lastip = line[1];

    hop[line[1]] = [+line[2]];

    for (let i = 3; i < line.length; ++i) {
        if (Net.isIP(line[i])) {
            lastip = line[i];
            if (!hop[lastip]) {
                hop[lastip] = [];
            }
        }
        else {
            hop[lastip].push(+line[i]);
        }
    }

    return hop;
};
