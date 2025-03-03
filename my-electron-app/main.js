// app, which controls your application's event lifecycle.
// BrowserWindow, which creates and manages app windows.

const { app, BrowserWindow, ipcMain, screen, dialog } = require('electron')
const path = require('path')
const macAccessibility = require('./native_mac')

let mainWindow
let overlayWindow
let isPolling = false

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow.loadFile('index.html')
}

const createOverlayWindow = () => {
  overlayWindow = new BrowserWindow({
    width: 40,
    height: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  overlayWindow.setVisibleOnAllWorkspaces(true)
  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.loadFile('overlay.html')
}

const showOverlayAtPosition = (x, y) => {
  if (!overlayWindow) {
    createOverlayWindow()
  }
  
  // オーバーレイウィンドウの位置を調整（アイコンがテキストの右下に表示されるように）
  overlayWindow.setPosition(Math.round(x), Math.round(y))
  overlayWindow.show()
}

// アクセシビリティ権限の確認と要求
async function checkAndRequestAccessibility() {
  const hasPermission = await macAccessibility.checkPermission();
  
  if (!hasPermission) {
    const result = await dialog.showMessageBox({
      type: 'info',
      title: 'アクセシビリティ権限が必要です',
      message: 'テキスト選択機能を使用するには、アクセシビリティの権限が必要です。\n「システム環境設定」が開きますので、アプリケーションにチェックを入れてください。',
      buttons: ['OK', 'キャンセル']
    });

    if (result.response === 0) {
      await macAccessibility.requestPermission();
      // 権限が付与されたか再確認
      const granted = await macAccessibility.checkPermission();
      if (!granted) {
        await dialog.showMessageBox({
          type: 'warning',
          message: 'アクセシビリティ権限が付与されていません。\nテキスト選択機能は利用できません。',
          buttons: ['OK']
        });
        return false;
      }
      return true;
    }
    return false;
  }
  return true;
}

// グローバルテキスト選択の監視
async function startTextSelectionPolling() {
  if (isPolling) return;
  isPolling = true;

  let lastSelectedText = '';
  
  while (isPolling) {
    try {
      const selectedText = await macAccessibility.getSelectedText();
      
      if (selectedText && selectedText !== lastSelectedText) {
        lastSelectedText = selectedText;
        
        // 選択範囲の位置を取得
        const bounds = await macAccessibility.getSelectionBounds();
        if (bounds) {
          showOverlayAtPosition(bounds.x, bounds.y);
        } else {
          // 位置が取得できない場合はマウスカーソルの位置を使用
          const point = screen.getCursorScreenPoint();
          showOverlayAtPosition(point.x + 20, point.y + 20);
        }
      } else if (!selectedText && lastSelectedText) {
        lastSelectedText = '';
        if (overlayWindow) {
          overlayWindow.hide();
        }
      }
    } catch (error) {
      console.error('Error in text selection polling:', error);
    }
    
    // 100ミリ秒待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

app.whenReady().then(async () => {
  createWindow();

  // アクセシビリティ権限をチェック
  const accessibilityGranted = await checkAndRequestAccessibility();
  if (accessibilityGranted) {
    // テキスト選択の監視を開始
    startTextSelectionPolling();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  isPolling = false;
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// オーバーレイがクリックされたときの処理
ipcMain.on('overlay-clicked', () => {
  if (overlayWindow) {
    overlayWindow.hide();
  }
});