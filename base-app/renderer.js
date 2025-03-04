const { clipboard } = require('electron');

// クリップボードの内容を表示する関数
function displayClipboardContent() {
  const infoElement = document.getElementById('info');

  // テキストの内容を取得
  const text = clipboard.readText();

  // 表示を更新
  infoElement.innerHTML = `
    <h2>クリップボードの内容:</h2>
    <h3>テキスト:</h3>
    <pre>${text}</pre>
  `;
}

// 定期的にクリップボードの内容を更新
setInterval(displayClipboardContent, 1000);

// 初期表示
displayClipboardContent();
