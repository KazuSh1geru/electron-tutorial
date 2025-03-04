// app, which controls your application's event lifecycle.
// BrowserWindow, which creates and manages app windows.

const { app, BrowserWindow, ipcMain, screen, dialog, systemPreferences } = require('electron')
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
        
        const bounds = await macAccessibility.getSelectionBounds();
        if (bounds) {
          showOverlayAtPosition(bounds.x, bounds.y);
        } else {
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
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// アプリケーションの初期化
app.whenReady().then(async () => {
  // アプリケーション起動時に権限チェック
  const hasPermission = await macAccessibility.checkPermission();
  if (!hasPermission) {
    // 権限がない場合は、ユーザーに設定を促すダイアログを表示
    await macAccessibility.requestPermission();
  }

  // アクセシビリティサポートを明示的に有効化
  app.setAccessibilitySupportEnabled(true);

  createWindow();

  // アクセシビリティ権限をチェック
  const accessibilityGranted = await checkAndRequestAccessibility();
  if (accessibilityGranted) {
    startTextSelectionPolling();
  }

  // アクセシビリティ状態の変更を監視
  macAccessibility.subscribeToAccessibilityChanges((granted) => {
    if (granted && !isPolling) {
      startTextSelectionPolling();
    } else if (!granted && isPolling) {
      isPolling = false;
      if (overlayWindow) {
        overlayWindow.hide();
      }
    }
  });

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
