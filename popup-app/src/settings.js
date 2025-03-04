const settings = {
  clipboard: {
    pollingInterval: 500, // クリップボードの監視間隔（ミリ秒）
  },
  popup: {
    width: 320, // ポップアップウィンドウの幅
    height: 200, // ポップアップウィンドウの高さ
    displayDuration: 3000, // 表示時間（ミリ秒）
    offset: {
      // カーソル位置からのオフセット
      x: 20,
      y: 20,
    },
  },
  correction: {
    processingTime: 2000, // 校正処理の模擬時間（ミリ秒）
  },
  window: {
    main: {
      width: 800,
      height: 600,
    },
  },
};

module.exports = settings;
