var util = require('util');
var winston = require('winston');
var scribe = require('scribe');
var os = require('os');

var Scribe = exports.Scribe = function (options) {
  options = options || {};
  options.host = options.host || 'localhost';
  options.port = options.port || 1463;

  this.name  = 'scribe';
  this.level = options.level || 'info';
  this.category = options.category || 'winston';
  this.client = new scribe.Scribe(options.host, options.port, {autoReconnect:true});
  this.isReady = false;

  var self = this;
  this.client.open(function(err){
    if(!err)
      self.isReady = true;
  });
};

util.inherits(Scribe, winston.Transport);
Scribe.prototype.log = function (level, msg, meta, callback) {

  var entry = {
    timestamp: (new Date()).toISOString(),
    host: os.hostname(),
    level: level,
    message: msg,
  };

  if (meta) {
    entry.meta = meta;
  }

  if (this.isReady){
    this.emit('logged');
    this.client.send(this.category, JSON.stringify(entry));
    return callback(null, true);
  }
  else
  {
    this.emit('error', null);
    return callback("Error: Scribe is not ready yet.",null)
  }
};

winston.transports.Scribe = Scribe;