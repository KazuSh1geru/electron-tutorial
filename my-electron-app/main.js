// app, which controls your application's event lifecycle.
// BrowserWindow, which creates and manages app windows.

const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let mainWindow
let overlayWindow

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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  overlayWindow.loadFile('overlay.html')
}

// テスト用: マウスの位置にオーバーレイを表示
const showOverlayAtMousePosition = () => {
  const { getCursorScreenPoint } = screen
  const point = getCursorScreenPoint()
  
  if (!overlayWindow) {
    createOverlayWindow()
  }
  
  overlayWindow.setPosition(point.x, point.y)
  overlayWindow.show()
}

app.whenReady().then(() => {
  createWindow()

  // テスト用のショートカットキーを登録
  const { globalShortcut } = require('electron')
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    showOverlayAtMousePosition()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// オーバーレイがクリックされたときの処理
ipcMain.on('overlay-clicked', () => {
  console.log('Overlay clicked!')
  if (overlayWindow) {
    overlayWindow.hide()
  }
})