const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('BROWSER_ERROR:', msg.text());
            } else {
                console.log('BROWSER_LOG:', msg.text());
            }
        });
        
        page.on('pageerror', error => {
            console.log('PAGE_ERROR:', error.message);
        });

        // Set local storage to mock auth token if needed, but since it's just frontend, let's see what happens.
        // Actually, let's navigate to the app
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
        
        // Try to click "Generate Invoice" or whatever route it is.
        // If there's an immediate error upon loading, it will be logged.
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        console.log("Puppeteer finished");
    } catch (e) {
        console.error("Puppeteer script failed:", e);
    }
})();
