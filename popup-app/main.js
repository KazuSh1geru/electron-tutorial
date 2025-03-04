const { app, BrowserWindow, ipcMain, clipboard, screen } = require('electron/main');
const logger = require('./src/utils/logger');
const TextCorrector = require('./src/services/TextCorrector');
const settings = require('./src/settings');

let popupWindow = null;
let mainWindow = null;
const textCorrector = new TextCorrector();

const createPopupWindow = cursorPosition => {
  try {
    // カーソル位置からディスプレイを特定
    const display = screen.getDisplayNearestPoint(cursorPosition);
    const { workArea } = display; // 実際の作業領域を取得（タスクバーなどを除く）

    // ポップアップウィンドウの作成
    popupWindow = new BrowserWindow({
      width: settings.popup.width,
      height: settings.popup.height,
      frame: false,
      transparent: true,
      skipTaskbar: true,
      focusable: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      // フルスクリーン対応の設定
      type: 'panel', // パネルタイプに変更（最も上位レイヤーで表示）
      hasShadow: false,
    });

    // ウィンドウの位置を設定
    // workArea内に収まるように位置を調整
    const x = Math.min(
      Math.max(cursorPosition.x, workArea.x),
      workArea.x + workArea.width - settings.popup.width
    );
    const y = Math.min(
      Math.max(cursorPosition.y, workArea.y),
      workArea.y + workArea.height - settings.popup.height
    );

    // 最前面に表示するための設定
    popupWindow.setAlwaysOnTop(true, 'screen-saver', 2);
    popupWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // 位置を設定してからウィンドウを表示
    popupWindow.setPosition(x, y);
    popupWindow.loadFile('popup.html');

    logger.info('Popup window created successfully');

    // 3秒後に自動的に閉じる
    setTimeout(() => {
      if (popupWindow && !popupWindow.isDestroyed()) {
        popupWindow.close();
        popupWindow = null;
      }
    }, settings.popup.displayDuration);

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

      // メインウィンドウにも新しいクリップボードの内容を送信
      if (mainWindow) {
        mainWindow.webContents.send('update-clipboard', currentText);
      }

      // ポップアップウィンドウが存在する場合は内容を更新
      if (popupWindow) {
        popupWindow.webContents.send('update-clipboard', currentText);
      }
    }
  }, settings.clipboard.pollingInterval);
}
const createWindow = () => {
  try {
    mainWindow = new BrowserWindow({
      width: settings.window.main.width,
      height: settings.window.main.height,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    // 開発時のデバッグ用
    // mainWindow.webContents.openDevTools();

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
