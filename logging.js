const winston = require('winston');

module.exports = winston.createLogger({
    level: 'info',
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.splat(),
        winston.format.cli(),
        winston.format.printf((info) => {
          return `${info.timestamp} ${info.level}\t${info.message}`;
        }),
      ),
  });
