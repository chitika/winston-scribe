var util = require('util');
var winston = require('winston');
var scribe = require('scribe');
var os = require('os');

function formatLogMessage(entry) {
  return JSON.stringify(entry);
}

var Scribe = exports.Scribe = function (options) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 1463;

  this.name  = 'scribe';
  this.level = options.level || 'info';
  this.category = options.category || 'winston';
  this.formatter = options.formatter || formatLogMessage;
  this.client = new scribe.Scribe(options.host, options.port, {autoReconnect:true});
  this.isReady = false;
  this.sendQueue = [];

  var self = this;
  this.client.open(function(err){
    if(!err)
      self.isReady = true;

    for (var entry in self.sendQueue) {
      self.client.send(self.category, self.formatter(self.sendQueue[entry]));
    }
  });
};

util.inherits(Scribe, winston.Transport);
Scribe.prototype.log = function (level, msg, meta, callback) {

  var entry = {
    timestamp: (new Date()).toISOString(),
    host: os.hostname(),
    level: level,
    message: msg
  };

  if (meta) {
    entry.meta = meta;
  }

  if (this.isReady){
    this.emit('logged');
    this.client.send(this.category, this.formatter(entry));
    return callback(null, true);
  }
  else
  {
    this.emit('queued');
    this.sendQueue.push(entry);
    return callback(null, true);
  }
};

winston.transports.Scribe = Scribe;