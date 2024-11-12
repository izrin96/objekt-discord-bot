import { chromium, type Browser } from "playwright-core";

let browser: Browser;

export async function initBrowser() {
    if (!browser || !browser.isConnected()) {
        try {
            browser = await chromium.launch({
                // executablePath: process.env.PLAYWRIGHT_BROSWER_PATH,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--hide-scrollbars',
                    '--disable-web-security',
                ],
            });
        } catch (error) {
            console.error("Failed to launch browser:", error);
            throw error;
        }
    }
    return browser;
}

export async function closeBrowser() {
    if (browser) {
        try {
            await browser.close();
        } catch (error) {
            console.error("Failed to close browser:", error);
        } finally {
            browser = undefined;
        }
    }
}
