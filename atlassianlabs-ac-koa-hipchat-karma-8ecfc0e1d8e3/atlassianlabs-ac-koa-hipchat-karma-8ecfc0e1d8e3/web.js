var MongoStore = require('ac-node').MongoStore;
var track = require('ac-koa-hipchat-keenio').track;
var Notifier = require('ac-koa-hipchat-notifier').Notifier;
var Karma = require('./lib/karma');

var ack = require('ac-koa').require('hipchat');
var pkg = require('./package.json');
var app = ack(pkg, {store: 'MongoStore'});

var addon = app.addon()
  .hipchat()
  .allowGlobal(true)
  .allowRoom(true)
  .scopes('send_notification');

track(addon);

var addonStore = MongoStore(process.env[app.config.MONGO_ENV], 'karma');
var notifier = Notifier({format: 'html', dir: __dirname + '/messages'});

addon.webhook('room_message', /^\/karma(?:\s+(:)?(.+?)\s*$)?/i, function *() {
  var global = !this.tenant.room;
  var match = this.match;
  var room = this.room;
  var karma = Karma(addonStore, this.tenant);
  var enabled = yield karma.isEnabled(room.id);
  var command = match && match[1] === ':' && match[2];
  var subject = match && !match[1] && match[2];
  if (command) {
    if (global && command === 'enable') {
      enabled = true;
      yield karma.setEnabled(room.id, enabled);
      return yield notifier.send('Karma matching has been enabled in this room.');
    } else if (global && command === 'disable') {
      enabled = false;
      yield karma.setEnabled(room.id, enabled);
      return yield notifier.send('Karma matching has been disabled in this room.');
    } else if (/^top\s+things$/.test(command)) {
      return yield notifier.sendTemplate('list', {
        category: 'things',
        type: 'most',
        list: yield karma.list('thing', true)
      });
    } else if (/^bottom\s+things$/.test(command)) {
      return yield notifier.sendTemplate('list', {
        category: 'things',
        type: 'least',
        list: yield karma.list('thing', false)
      });
    } else if (/^top\s+users/.test(command)) {
      return yield notifier.sendTemplate('list', {
        category: 'users',
        type: 'most',
        list: yield karma.list('user', true)
      });
    } else if (/^bottom\s+users/.test(command)) {
      return yield notifier.sendTemplate('list', {
        category: 'users',
        type: 'least',
        list: yield karma.list('user', false)
      });
    } else {
      return yield notifier.send('Sorry, I didn\'t understand that.');
    }
  } else if (subject) {
    if (subject.charAt(0) === '@') {
      var user = findUser(this.message.mentions, subject.slice(1))
      var value;
      if (user) {
        subject = user.name;
        value = yield karma.forUser(user.id);
      } else {
        value = yield karma.forThing(subject);
      }
    } else {
      value = yield karma.forThing(subject);
    }
    return yield notifier.send(subject + ' has ' + value + ' karma.');
  } else {
    return yield notifier.sendTemplate('help', {
      enabled: enabled ? 'enabled' : 'disabled',
      global: global
    });
  }
});

var strIncDec =
    '(?:' +
      '(?:(?:(@[\\u00C0-\\u1FFF\\u2C00-\\uD7FF\\w]+))\\s?)|' +
      '([\\u00C0-\\u1FFF\\u2C00-\\uD7FF\\w]+)|' +
      '(\\([\\u00C0-\\u1FFF\\u2C00-\\uD7FF\\w]+\\))|' +
      '(?:(["\'])([^\'"]+)[\'"])' +
    ')(\\+{2,}|-{2,})( |$)';
addon.webhook('room_message', new RegExp(strIncDec), function *() {
  var room = this.room;
  var sender = this.sender;
  var karma = Karma(addonStore, this.tenant);

  // don't parse other slash commands
  if (/^\/\w+/.test(this.content)) return;
  // don't respond if disabled in the current room
  if (!(yield karma.isEnabled(room.id))) return;

  var reIncDec = new RegExp(strIncDec, 'g');
  var match;
  var message = [];
  var matches = {};
  while (match = reIncDec.exec(this.content)) {
    var subject;
    var isMention = match[1] && match[1].charAt(0) === '@';
    var change = match[6].length - 1;
    var maxed = false;
    if (change > 5) {
      change = 5;
      maxed = true;
    }
    var value;
    if (match[6].charAt(0) === '-') {
      change = -change;
    }
    var changed = (change > 0 ? 'increased' : 'decreased');
    if (isMention) {
      var user = findUser(this.message.mentions, match[1].slice(1));
      if (user) {
        if (user.id === sender.id) {
          message.push(change > 0 ? 'Don\'t be a weasel.' : 'Aw, don\'t be so hard on yourself.');
          continue;
        } else {
          subject = user.name;
          if (matches[subject]) continue;
          value = yield karma.updateUser(user, change);
        }
      } else {
        subject = match[1];
        if (matches[subject]) continue;
        value = yield karma.updateThing(subject, change);
      }
    } else {
      subject = match[2] || match[3] || match[5];
      if (matches[subject]) continue;
      value = yield karma.updateThing(subject, change);
    }
    matches[subject] = true;
    var possessive = subject + '\'' + (subject.charAt(subject.length - 1) === 's' ? '' : 's');
    var line = possessive + ' karma has ' + changed + ' to ' + value;
    if (maxed) {
      line += ' (Buzzkill Mode™ has enforced a maximum change of 5 points)';
    }
    line +='.';
    message.push(line);
  }
  message = message.join('<br>');
  if (message.length > 0) {
    yield notifier.send(message);
  }
});

app.listen();

function findUser(mentions, mention) {
  mention = mention.toLowerCase();
  return mentions.find(function (user) {
    return user && user.mention_name && user.mention_name.toLowerCase() === mention;
  });
}
