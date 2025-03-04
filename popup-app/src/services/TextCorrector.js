const DUMMY_CORRECTED_TEXT = 'TODO: 後ほど実装する';

class TextCorrector {
  constructor() {
    this.processingTime = 2000; // 処理時間を2秒に設定
  }

  async correct(text) {
    // 処理中であることを示すログ
    console.log('校正処理を開始します...');

    // 処理時間を模擬
    await new Promise(resolve => setTimeout(resolve, this.processingTime));

    // ダミーの校正結果を返す
    return {
      original: text,
      corrected: DUMMY_CORRECTED_TEXT,
      status: 'success',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = TextCorrector;
