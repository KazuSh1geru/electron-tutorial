const { app, BrowserWindow, ipcMain, clipboard, screen } = require('electron/main');
const logger = require('./src/utils/logger');
const TextCorrector = require('./src/services/TextCorrector');

let popupWindow = null;
let mainWindow = null;
const textCorrector = new TextCorrector();

const createPopupWindow = cursorPosition => {
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
    popupWindow.setPosition(cursorPosition.x + offset, cursorPosition.y + offset);

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
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    mainWindow.loadFile('index.html');
    logger.info('Main window created successfully');
  } catch (error) {
    logger.error('Failed to create main window:', error);
    app.quit();
  }
};

// IPC通信の設定
ipcMain.on('correct-text', async (event, text) => {
  try {
    logger.info('Text correction requested:', text);

    // メインウィンドウに処理中メッセージを表示
    mainWindow.webContents.send('correction-status', '校正しています...');

    // クリップボードから現在のテキストを取得
    const clipboardText = clipboard.readText();

    // 校正処理を実行
    const result = await textCorrector.correct(clipboardText);

    // 処理結果をメインウィンドウに送信
    mainWindow.webContents.send('correction-complete', result);

    // ポップアップウィンドウを閉じる
    if (popupWindow) {
      popupWindow.close();
      popupWindow = null;
    }
  } catch (error) {
    logger.error('Text correction failed:', error);
    mainWindow.webContents.send('correction-error', error.message);
  }
});

app
  .whenReady()
  .then(() => {
    logger.info('Application started');
    createWindow();
    startClipboardMonitoring();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  })
  .catch(error => {
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
process.on('uncaughtException', error => {
  logger.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
