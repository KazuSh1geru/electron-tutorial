const { app, BrowserWindow } = require('electron/main');
const logger = require('./src/utils/logger');

const createWindow = () => {
  try {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    win.loadFile('index.html');
    
    // デバッグツールを開く
    // win.webContents.openDevTools();
    
    logger.info('Main window created successfully');
  } catch (error) {
    logger.error('Failed to create main window:', error);
    app.quit();
  }
};

app.whenReady().then(() => {
  logger.info('Application started');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(error => {
  logger.error('Failed to start application:', error);
  app.quit();
});

app.on('window-all-closed', () => {
  logger.info('All windows closed, application will quit');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('Application is quitting');
});

// エラーハンドリング
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});