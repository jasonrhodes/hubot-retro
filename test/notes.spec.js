var expect = require('chai').expect;
var notesInit = require('../src/notes');
var sinon = require('sinon');
var _ = require('lodash');

describe('Notes DB', function () {

  it('should return a new notes object with a default db property on init', function () {
    var N = notesInit();
    expect(N).to.be.an('object');
    expect(N.db).to.deep.equal({ notes: [] });
  });

  it('should allow an existing db object to be passed in by reference', function () {
    var db = { retro: { color: 'red' } };
    var N = notesInit(db);
    expect(N.db.notes).to.be.an('array').with.length(0);
    expect(N.db.color).to.equal('red');
    db.retro.color = 'blue';
    expect(N.db.color).to.equal('blue');
  });

  describe('instances', function () {

    var N;
    var clock;
    var exampleNote = { 
      person: 'heisenberg',
      type: 'good',
      text: 'i liked being the one who knocks'
    };
    var exampleDb = { retro: {
      notes: [
        {type: 'good', text: 'abc', person: 'ww', createdAt: new Date('2010-01-01T00:00:00Z'), id: '1a'},
        {type: 'bad',  text: 'def', person: 'hz', createdAt: new Date('2011-04-29T00:00:00Z'), id: '2b'},
        {type: 'bad',  text: 'ghi', person: 'ww', createdAt: new Date('2012-08-31T00:00:00Z'), id: '3c'},
        {type: 'good', text: 'jkl', person: 'ww', createdAt: new Date('2013-12-01T00:00:00Z'), id: '4d'}
      ]
    }};

    beforeEach(function () {
      // clock = sinon.useFakeTimers(new Date('2015-01-01T08:00:00-0400').getTime());
      N = notesInit(_.cloneDeep(exampleDb));
    });

    afterEach(function () {
      // clock.restore();
    });

    it('should save a new note', function (done) {
      var startCount = N.db.notes.length;
      N.save(exampleNote, function (err, result) {
        var saved = N.db.notes[N.db.notes.length - 1];
        expect(err).to.be.null;
        expect(result).to.be.an('object');
        expect(result).to.deep.equal(saved);
        expect(N.db.notes).to.have.length(startCount + 1);
        expect(saved.createdAt).to.be.an.instanceof(Date);
        expect(saved.id).to.be.a('string');
        done();
      });
    });

    it('should call back with an error if the save fails', function (done) {
      var substr = String.prototype.substr;
      delete String.prototype.substr;
      N.save(exampleNote, function (err) {
        expect(err).to.exist;
        String.prototype.substr = substr;
        done();
      });
    });

    it('should retrieve all existing notes, grouped by type', function (done) {
      N.retrieve(function (err, results) {
        expect(err).to.be.null;
        expect(results.good).to.exist.and.to.have.length(2);
        expect(results.bad).to.exist.and.to.have.length(2);
        done();
      });
    });

    it('should retrieve notes since a date', function (done) {
      N.retrieveSince('2012-01-01', function (err, results) {
        expect(err).to.be.null;
        expect(results.good).to.exist.and.to.have.length(1);
        expect(results.bad).to.exist.and.to.have.length(1);
        done();
      });
    });

    it('should retrieve notes since a partial date', function (done) {
      N.retrieveSince('2013', function (err, results) {
        expect(err).to.be.null;
        expect(results.good).to.exist.and.to.have.length(1);
        expect(results.bad).to.be.undefined;
        done();
      });
    });

    it('should handle timezone comparisons correctly but this seems impossible to test because you cant mock out the "local" timezone');

    it('should retrieve notes by person', function (done) {
      N.retrieveByPerson('ww', function (err, results) {
        expect(err).to.be.null;
        expect(results.good).to.exist.and.to.have.length(2);
        expect(results.bad).to.exist.and.to.have.length(1);
        done();
      });
    });

    it('should retrieve notes by person since a date', function (done) {

      N.retrieveSince('2011', function (err, results) {
        expect(err).to.be.null;
        expect(results.bad).to.exist.and.to.have.length(2);

        N.retrieveByPersonSince('ww', '2011', function (err, results) {
          expect(err).to.be.null;
          expect(results.bad).to.exist.and.to.have.length(1);

          done();
        });
      });
    });

  });

});