const winston = require('winston');
const path = require('path');
const { app } = require('electron');

// ログディレクトリのパスを設定
const logDir = path.join(app.getAppPath(), 'logs');

// ログフォーマットの定義
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// ロガーの作成
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Infoレベルのログをapp.logに出力
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Errorレベルのログをerror.logに出力
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 開発環境の場合はコンソールにも出力
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: logFormat,
  }));
}

module.exports = logger; 