const { ipcRenderer } = require('electron');

document.addEventListener('mouseup', (event) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText) {
        // 選択範囲の位置情報を取得
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // ウィンドウの位置を考慮した絶対座標を計算
        const x = window.screenX + rect.left + rect.width;
        const y = window.screenY + rect.top + rect.height;

        // メインプロセスに選択イベントを通知
        ipcRenderer.send('text-selected', {
            text: selectedText,
            position: { x, y }
        });
    } else {
        // テキストが選択されていない場合はオーバーレイを非表示にする
        ipcRenderer.send('hide-overlay');
    }
}); 