const { systemPreferences, app } = require('electron');
const macPermissions = require('node-mac-permissions');
const activeWin = require('active-win');

class MacAccessibility {
    constructor() {
        this.hasPermission = false;
        this.lastClipboard = '';
    }

    async checkPermission() {
        try {
            // 両方のチェックを実行
            const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
            const isEnabled = systemPreferences.isAXIsEnabled();
            return isTrusted && isEnabled;
        } catch (error) {
            console.error('Error checking accessibility permission:', error);
            return false;
        }
    }

    async requestPermission() {
        try {
            // アクセシビリティサポートを明示的に有効化
            app.setAccessibilitySupportEnabled(true);
            return systemPreferences.isTrustedAccessibilityClient(true);
        } catch (error) {
            console.error('Error requesting accessibility permission:', error);
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
                exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
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
    return mouse location
end tell`;

            return new Promise((resolve, reject) => {
                const { exec } = require('child_process');
                exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
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
        systemPreferences.subscribeNotification(
            'AXIsProcessTrustedChanged',
            async () => {
                const granted = await this.checkPermission();
                callback(granted);
            }
        );
    }
}

module.exports = new MacAccessibility();