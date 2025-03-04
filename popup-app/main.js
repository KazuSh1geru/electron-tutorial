const { app, BrowserWindow, ipcMain, clipboard, screen } = require('electron/main');
const logger = require('./src/utils/logger');

let popupWindow = null;

const createPopupWindow = (cursorPosition) => {
  try {
    // ポップアップウィンドウの作成
    popupWindow = new BrowserWindow({
      width: 320,
      height: 200,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // カーソル位置から少しオフセットした位置に表示
    const offset = 20;
    popupWindow.setPosition(
      cursorPosition.x + offset,
      cursorPosition.y + offset
    );

    popupWindow.loadFile('popup.html');
    logger.info('Popup window created successfully');

    // 3秒後に自動的に閉じる
    setTimeout(() => {
      if (popupWindow) {
        popupWindow.close();
        popupWindow = null;
      }
    }, 3000);
  } catch (error) {
    logger.error('Failed to create popup window:', error);
  }
};

// クリップボード監視用の変数
let lastClipboardText = '';

// クリップボードの監視を開始
function startClipboardMonitoring() {
  setInterval(() => {
    const currentText = clipboard.readText();
    if (currentText !== lastClipboardText) {
      lastClipboardText = currentText;
      const cursorPosition = screen.getCursorScreenPoint();
      createPopupWindow(cursorPosition);
      
      // ポップアップウィンドウが存在する場合は内容を更新
      if (popupWindow) {
        popupWindow.webContents.send('update-clipboard', currentText);
      }
    }
  }, 500);
}

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
    logger.info('Main window created successfully');
  } catch (error) {
    logger.error('Failed to create main window:', error);
    app.quit();
  }
};

// IPC通信の設定
ipcMain.on('correct-text', (event, text) => {
  logger.info('Text correction requested:', text);
  // TODO: テキスト校正処理の実装
  if (popupWindow) {
    popupWindow.close();
    popupWindow = null;
  }
});

app.whenReady().then(() => {
  logger.info('Application started');
  createWindow();
  startClipboardMonitoring();

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