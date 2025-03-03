const { systemPreferences } = require('electron');
const macPermissions = require('node-mac-permissions');
const activeWin = require('active-win');

class MacAccessibility {
    constructor() {
        this.hasPermission = false;
    }

    async checkPermission() {
        // アクセシビリティの権限をチェック
        try {
            return systemPreferences.isTrustedAccessibilityClient(false);
        } catch (error) {
            console.error('Error checking accessibility permission:', error);
            return false;
        }
    }

    async requestPermission() {
        // アクセシビリティの権限をリクエスト
        try {
            // システム環境設定のセキュリティとプライバシーパネルを開く
            return systemPreferences.isTrustedAccessibilityClient(true);
        } catch (error) {
            console.error('Error requesting accessibility permission:', error);
            return false;
        }
    }

    async getSelectedText() {
        try {
            // アクティブウィンドウの情報を取得
            const activeWindow = await activeWin();
            if (!activeWindow) return null;

            // AppleScriptを使用してテキスト選択を取得
            const script = `
                tell application "System Events"
                    tell process "${activeWindow.owner.name}"
                        set selectedText to value of attribute "AXSelectedText" of first window
                        return selectedText
                    end tell
                end tell
            `;

            // AppleScriptを実行
            const { exec } = require('child_process');
            return new Promise((resolve, reject) => {
                exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Error executing AppleScript:', error);
                        resolve(null);
                    } else {
                        resolve(stdout.trim());
                    }
                });
            });
        } catch (error) {
            console.error('Error getting selected text:', error);
            return null;
        }
    }

    async getSelectionBounds() {
        // 選択範囲の位置情報を取得するAppleScript
        const script = `
            tell application "System Events"
                set frontApp to first application process whose frontmost is true
                set selectedElement to value of attribute "AXSelectedTextRange" of first window of frontApp
                return {x: selectedElement's position's x, y: selectedElement's position's y}
            end tell
        `;

        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
                if (error) {
                    console.error('Error getting selection bounds:', error);
                    resolve(null);
                } else {
                    try {
                        const [x, y] = stdout.trim().split(',').map(Number);
                        resolve({ x, y });
                    } catch (e) {
                        resolve(null);
                    }
                }
            });
        });
    }
}

module.exports = new MacAccessibility(); 