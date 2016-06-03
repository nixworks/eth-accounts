var assert = require('chai').assert,
    expect = require("chai").expect;
    temp = require('temp'),
    rmdir = require('rimraf'),
    ethUtils = require('ethereumjs-util')
    accounts = require('../build/Release/eth-account.node');

describe('Sync create', function() {
	this.timeout(10000);
	
	var path = temp.path();
	var manager = accounts.AccountManager(path);
	var passwd = 'my passwd';
	
	after(function() {
		rmdir(path, function(error) {
			if (error) {
				console.log('unable to remove test keystore directory', path, error);
			}
		});
	});
	
	it('new account', function() {
		var accountsBefore = manager.accounts();
		// throws on failure
		var account = manager.newAccount(passwd);
		var accountsAfter = manager.accounts();
				
		// test if the newly created account is added to the list
		expect(accountsBefore.length + 1).to.equal(accountsAfter.length);
		
		// verify that the account list has the newly created account
		assert.notEqual(-1, accountsAfter.indexOf(account));
	});
});
	
describe('Sync unlock', function() {
	this.timeout(10000);
	
	var path = temp.path();
	var manager = accounts.AccountManager(path);
	var passwd = 'my passwd';

	after(function() {
		rmdir(path, function(error) {
			if (error) {
				console.log('unable to remove test keystore directory', path, error);
			}
		});
	});
		
	it('account', function() {
		var account = manager.newAccount(passwd);
		
		expect(manager.unlock(account, passwd)).to.be.true;
		expect(manager.unlock(account, 'invalid' + passwd)).to.be.false;
	});
});

describe('Sync lock', function() {
	this.timeout(10000);
	
	var path = temp.path();
	var manager = accounts.AccountManager(path);
	var passwd = 'my passwd';
	
	it('account', function() {
		var address = manager.newAccount(passwd);
		
		// make sure account is locked
		var data = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		var sign = function () { manager.sign(address, data); };
		expect(sign).to.throw('account is locked');
		
		// unlock and make sure we can sign data
		expect(manager.unlock(address, passwd)).to.be.true;
		var sign = manager.sign(address, data);
		expect(sign.length).to.equal(132);
		
		// verify that account is locked	
		expect(manager.lock(address)).to.be.true;
		var sign = function () { manager.sign(address, data); };
		expect(sign).to.throw('account is locked');		
	});
});

describe('Sync sign', function() {
	this.timeout(10000);
	
	var path = temp.path();
	var manager = accounts.AccountManager(path);
	var passwd = 'my passwd';
	
	after(function() {
		rmdir(path, function(error) {
			if (error) {
				console.log('unable to remove test keystore directory', path, error);
			}
		});
	});
	
	
	it('data and verify signature', function() {
		var address = manager.newAccount(passwd);
		var data = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		
		assert(manager.unlock(address, passwd));
		
		var sig = manager.sign(address, data);
		expect(sig.length).to.equal(132);
		
		// strip 0x
		sig = sig.substr(2);
		
		// test signature
		var d = new Buffer(data.substr(2), 'hex');
		var r = new Buffer(sig.substr(0, 64), 'hex');
		var s = new Buffer(sig.substr(64, 64), 'hex');
		var v = parseInt(sig.substr(128, 2), 16) + 27;
		
		var pubKey = ethUtils.ecrecover(d, v, r, s);	
		var r = ethUtils.publicToAddress(pubKey);
		
    	assert.equal('0x' + r.toString('hex'), address);
	});
	
	it('with locked account', function() {
		var account = manager.newAccount(passwd);
		var data = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
		
		var sign = function () { manager.sign(account, data); };
		expect(sign).to.throw('account is locked');
	});
});

