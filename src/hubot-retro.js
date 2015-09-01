var notesInit = require('./notes');
var _ = require('lodash');

module.exports = function (robot) {

  robot.error(function (err, res) {
    if (res) {
      res.reply("Someone broke me again: #{err.message}");
      robot.messageRoom('#debug', err.stack);
    }
    robot.logger.error(err.message);
    robot.logger.error(err.stack);
    robot.logger.error(JSON.stringify(robot.brain.data.retro, null, '\t'));
  });

  robot.brain.on("loaded", function () {
    var notes = notesInit(robot.brain.data);

    robot.respond(/retro (add )?(good|bad) ([\s\S]*)/i, function (res) {
      var note = {
        person: sender(res),
        type: res.match[2],
        text: res.match[3]
      };
      notes.save(note, function (err, saved) {
        if (err) {
          return res.reply('Error saving note, ' + err);
        }
        res.reply('Thanks for the note! Retrieve your notes with `retro retrieve`');
      });
    });

    robot.respond(/retro me ?/i, function (res) {
      notes.retrieveByPerson(sender(res), function (err, groups) {
        if (err) {
          return res.reply('Error retrieving notes, ' + err);
        }
        replyNotesByType(groups, res);
      });
    });

    robot.respond(/retro (time|all) ?/i, function (res) {
      notes.retrieve(function (err, groups) {
        if (err) {
          return res.reply('Error retrieveing notes, ' + err);
        }
        replyNotesByType(groups, res);
      });
    });

    robot.respond(/retro since (.+)/i, function (res) {
      var since = res.match[1];
      notes.retrieveSince(since, function (err, groups) {
        if (err) {
          return res.reply('Error retrieving notes since ' + since + ', ' + err);
        }
        res.reply('_Notes since ' + since + '_');
        replyNotesByType(groups, res);
      });
    });

    robot.hear(/^retro raw-notes/i, function (res) {
      res.reply('Notes? ' + JSON.stringify(robot.brain.data.retro.notes));
    });

    robot.respond(/retro delete note ([a-fA-F0-9]{6})/i, function (res) {
      notes.deleteNote(res.match[1], sender(res), function (err, n) {
        if (err || n <= 0) {
          return res.reply('Error deleting note, ' + (err || 'no matching ids for ' + res.match[1]));
        }
        res.reply('Deleted ' + n + ' note(s)');
      });
    });

  });

};

function replyNotesByType(groups, res) {
  _.forEach(groups, function (notes, group) {
    var bullet = (group === 'good') ? ':thumbsup:' : ':thumbsdown:';
    notes = _.map(notes, function (note) {
      return note.replace(/\n/, '\n> ');
    });
    res.reply('*the ' + group + 's:*\n\n> ' + bullet + ' ' + notes.join('\n>\n> ' + bullet + ' ') + '\n\n---\n');
  });
}

function sender(res) {
  return res.message.user.name;
}

// hubot retro add good : i really liked when we ate those cookies
// hubot retro add bad : i wasn't a fan of when the cookies were gone