const { clipboard } = require('electron');
const logger = require('./src/utils/logger');

// クリップボードの内容を表示する関数
function displayClipboardContent() {
  try {
    const infoElement = document.getElementById('info');
    const text = clipboard.readText();
    
    // 表示を更新
    infoElement.innerHTML = `
      <h2>クリップボードの内容:</h2>
      <h3>テキスト:</h3>
      <pre>${text}</pre>
    `;
    
    logger.info('Clipboard content updated');
  } catch (error) {
    logger.error('Failed to update clipboard content:', error);
  }
}

// 定期的にクリップボードの内容を更新
setInterval(displayClipboardContent, 1000);

// 初期表示
displayClipboardContent();