'use strict';


const Code = require('code');
const Lab = require('lab');
const Traceroute = require('../traceroute');


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('Traceroute', () => {

    let testInternetTIM = '156.54.69.9';
    let testIntranetIP = '10.197.9.74';
    let testLocalIP = '127.0.0.1';
    let options = {
        maxhops: 30
    };
        
    it('traces a route to local IP', (done) => {
        Traceroute.trace(testLocalIP, options, (err, hops) => {
            console.log('TEST->')
            console.log(hops);
            expect(err).to.not.exist();
            expect(hops).to.exist();
            expect(hops[hops.length - 1][testLocalIP]).to.exist();
            done();
        });
    });

    it('traces a route to internet TIM', (done) => {
        Traceroute.trace(testInternetTIM, options, (err, hops) => {
            console.log('TEST->')
            console.log(hops);
            expect(err).to.not.exist();
            expect(hops).to.exist();
            expect(hops[hops.length - 1][testInternetTIM]).to.exist();
            done();
        });
    });

    it('traces a route to intranet IP', (done) => {
        Traceroute.trace(testIntranetIP, options, (err, hops) => {
            console.log('TEST->')
            console.log(hops);
            expect(err).to.not.exist();
            expect(hops).to.exist();
            expect(hops[hops.length - 1][testIntranetIP]).to.exist();
            done();
        });
    });

    it('traces a route to google dns', (done) => {

        Traceroute.trace('8.8.8.8', null, (err, hops) => {

            expect(err).to.not.exist();
            expect(hops).to.exist();
            expect(hops[hops.length - 1]['8.8.8.8']).to.exist();
            done();
        });
    });

    it('streams traceroute results', (done) => {

        const trace = Traceroute.trace('8.8.8.8');

        trace.on('hop', (hop) => {

            expect(hop).to.exist();
            trace.removeAllListeners();
            done();
        });
    });
});
