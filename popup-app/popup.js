const { ipcRenderer } = require('electron');

// クリップボードの内容を表示
function updateClipboardContent(text) {
  const contentElement = document.getElementById('clipboard-content');
  contentElement.textContent = text;
}

// 校正ボタンのクリックイベント
document.getElementById('main-correction-button').addEventListener('click', () => {
  const text = document.getElementById('clipboard-content').textContent;
  ipcRenderer.send('correct-text', text);
});

// メインプロセスからの更新を受け取る
ipcRenderer.on('update-clipboard', (event, text) => {
  updateClipboardContent(text);
});
