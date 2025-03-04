const { systemPreferences, app } = require('electron');
const macPermissions = require('node-mac-permissions');
const activeWin = require('active-win');

class MacAccessibility {
    constructor() {
        this.hasPermission = false;
        this.lastClipboard = '';
    }

    async checkPermission   () {
        try {
            // アクセシビリティ権限のチェック
            const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
            
            // Apple Eventsの権限もチェック
            const hasAppleEventsPermission = await macPermissions.getAuthStatus('apple-events');
            
            return isTrusted && hasAppleEventsPermission === 'authorized';
        } catch (error) {
            console.error('Error checking permissions:', error);
            return false;
        }
    }

    async requestPermission() {
        try {
            // まずアクセシビリティ権限をリクエスト
            const accessibilityGranted = systemPreferences.isTrustedAccessibilityClient(true);
            
            // Apple Events権限もリクエスト
            await macPermissions.requestAuth('apple-events');
            
            // 権限が付与されたかを再確認
            return this.checkPermission();
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return false;
        }
    }

    async getSelectedText() {
        try {
            const script = `
tell application "System Events"
    set prevClipboard to the clipboard
    keystroke "c" using {command down}
    delay 0.1
    set selectedText to the clipboard
    set the clipboard to prevClipboard
    return selectedText
end tell`;

            return new Promise((resolve, reject) => {
                const { exec } = require('child_process');
                // maxBufferを増やし、大きなテキストも処理できるようにする
                exec(`osascript -e '${script}'`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error executing AppleScript:', error);
                        resolve(null);
                    } else {
                        const text = stdout.trim();
                        if (text !== this.lastClipboard) {
                            this.lastClipboard = text;
                            resolve(text);
                        } else {
                            resolve(null);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error getting selected text:', error);
            return null;
        }
    }

    async getSelectionBounds() {
        try {
            // マウスカーソルの位置を取得するAppleScript
            const script = `
tell application "System Events"
    set mousePos to (get mouse location)
    return mousePos
end tell`;

            return new Promise((resolve, reject) => {
                const { exec } = require('child_process');
                // maxBufferオプションをこちらにも追加
                exec(`osascript -e '${script}'`, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error getting mouse position:', error);
                        resolve(null);
                    } else {
                        try {
                            const [x, y] = stdout.trim().split(", ").map(Number);
                            resolve({ x, y });
                        } catch (e) {
                            resolve(null);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Error getting selection bounds:', error);
            return null;
        }
    }

    subscribeToAccessibilityChanges(callback) {
        // 権限変更の監視を強化
        systemPreferences.subscribeNotification(
            'AXIsProcessTrustedChanged',
            async () => {
                const granted = await this.checkPermission();
                callback(granted);
            }
        );

        // 初期状態もチェック
        this.checkPermission().then(granted => callback(granted));
    }
}

module.exports = new MacAccessibility();