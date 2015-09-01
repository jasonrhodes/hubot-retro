var _ = require('lodash');
var crypto = require('crypto');
var moment = require('moment');

module.exports = function (db) {
  return new NotesDb(db);
};

function NotesDb(braindata) {
  braindata = braindata || {};
  braindata.retro = braindata.retro || {};
  if (!braindata.retro.notes) {
    braindata.retro.notes = []; 
  }
  this.db = braindata.retro;
}

/**
 * Save a retro note
 * Include in options:
 * - person (slack username)
 * - type (good/bad)
 * - text
 */
NotesDb.prototype.save = function (options, callback) {
  try {
    options.createdAt = new Date();
    options.id = md5(options.person + options.text).substr(0, 6);
    this.db.notes.push(options);
  } catch (error) {
    return callback(error);
  }
  callback(null, options);
};

// NotesDb.prototype.team = function (name) {
//   this.db[name] = this.db[name] || [];
//   return this.db[name];
// };

NotesDb.prototype.retrieve = function (callback) {
  var results;
  try {
    results = this.stringifyTypeGroups(this.db.notes);
  } catch (error) {
    return callback(error);
  }
  callback(null, results);
};

function filterSince(list, date) {
  return _.filter(list, function (note) {
    return moment(new Date(date)).isBefore(moment(note.createdAt).local());
  });
}

NotesDb.prototype.retrieveSince = function (since, callback) {
  var results;
  try {
    var filtered = filterSince(this.db.notes, since);
    results = this.stringifyTypeGroups(filtered);
  } catch (error) {
    return callback(error);
  }
  callback(null, results);
};

NotesDb.prototype.retrieveByPerson = function (person, callback) {
  var results, self = this;
  try {
    var filtered = filterBy(this.db.notes, 'person', person);
    results = self.stringifyTypeGroups(filtered);
  } catch (error) {
    return callback(error);
  }
  callback(null, results);
};

NotesDb.prototype.retrieveByPersonSince = function (person, since, callback) {
  var results;
  try {
    var filtered = filterBy(this.db.notes, 'person', person);
    filtered = filterSince(filtered, since);
    results = this.stringifyTypeGroups(filtered);
  } catch (error) {
    return callback(error);
  }
  callback(null, results);
};

NotesDb.prototype.deleteByPerson = function (person, callback) {
  try {
    _.remove(this.db.notes, function (note) {
      return note.person === person;
    });
  } catch (error) {
    return callback(error);
  }
  callback(null);
};

NotesDb.prototype.deleteAll = function (callback) {
  try {
    this.db.notes = [];
  } catch (error) {
    return callback(error);
  }
  callback(null);
};

NotesDb.prototype.deleteOne = function (id, person, callback) {
  var start = this.db.notes.length;
  try {
    _.remove(this.db.notes, function (note) {
      return note.id === id && note.person === person;
    });
  } catch (error) {
    return callback(error);
  }
  callback(null, start - this.db.notes.length);
};

NotesDb.prototype.stringifyTypeGroups = function (list) {
  return _.chain(list)
    .groupBy('type')
    .map(function (notes, name) { 
      return [name, _.map(notes, noteToString)]; 
    })
    .object()
    .value();
};

function filterBy(list, key, value) {
  return _.filter(list, function (item) {
    return item[key] === value;
  });
}

function noteToString(note) {
  var timestamp = moment(note.createdAt).local().format('MM-DD-YY');
  return note.text + '\n[' + timestamp + '][' + note.id + ']';
}

/**
 * Return an md5 hash
 * @param  {String} value String to hash
 * @return {String}       Hashed value
 */
function md5(value) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(value);
  return md5sum.digest('hex');
}