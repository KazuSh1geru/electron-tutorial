const { ipcRenderer } = require('electron');

console.log('Renderer process started');

// 初期表示
const infoElement = document.getElementById('info');
infoElement.innerHTML = `
  <div id="clipboard-content">
    <h2>クリップボードの内容:</h2>
    <h3>テキスト:</h3>
    <pre>クリップボードの内容が変更されると、ここに表示されます</pre>
  </div>
  <div id="correction-area"></div>
`;

// 校正状態を表示する関数
function displayCorrectionStatus(status) {
  const correctionArea = document.getElementById('correction-area');
  if (correctionArea) {
    correctionArea.innerHTML = `
      <h2>校正状態:</h2>
      <p>${status}</p>
    `;
  }
}

// 校正結果を表示する関数
function displayCorrectionResult(result) {
  const correctionArea = document.getElementById('correction-area');
  if (correctionArea) {
    correctionArea.innerHTML = `
      <h2>校正結果:</h2>
      <h3>元のテキスト:</h3>
      <pre>${result.original}</pre>
      <h3>校正後のテキスト:</h3>
      <pre>${result.corrected}</pre>
      <p>処理日時: ${new Date(result.timestamp).toLocaleString()}</p>
    `;
  }
}

// エラーを表示する関数
function displayError(error) {
  const correctionArea = document.getElementById('correction-area');
  if (correctionArea) {
    correctionArea.innerHTML = `
      <h2>エラーが発生しました:</h2>
      <p style="color: red;">${error}</p>
    `;
  }
}

// IPCイベントの設定
ipcRenderer.on('correction-status', (event, status) => {
  displayCorrectionStatus(status);
});

ipcRenderer.on('correction-complete', (event, result) => {
  displayCorrectionResult(result);
});

ipcRenderer.on('correction-error', (event, error) => {
  displayError(error);
});
