
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
        headless: "new",
        defaultViewport: { width: 1280, height: 720 }
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to app...');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Wait for some files to load (look for file icons or folders)
        // Adjust selector based on actual rendered HTML if needed
        await page.waitForSelector('svg', { timeout: 5000 }); 
        
        // 1. Dashboard Screenshot
        console.log('Capturing Dashboard...');
        await new Promise(r => setTimeout(r, 2000)); // Wait for animations/loading
        await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard.png') });

        // 2. Search Screenshot
        console.log('Capturing Search...');
        const searchInput = await page.$('input[type="text"]');
        if (searchInput) {
            await searchInput.type('Word');
            await new Promise(r => setTimeout(r, 1000)); // Wait for search results
            await page.screenshot({ path: path.join(OUTPUT_DIR, 'search.png') });
            
            // Clear search
            await searchInput.click({ clickCount: 3 });
            await searchInput.press('Backspace');
            await new Promise(r => setTimeout(r, 500)); 
        } else {
            console.log('Search input not found!');
        }

        // 3. Context Menu Screenshot
        console.log('Capturing Context Menu...');
        // Find a folder or file to right-click
        // We look for a grid item or list item. 
        // Based on code, files might be rendered as divs or buttons.
        // Let's try to find an element with text content or just the first clickable item in the grid
        const elements = await page.$$('div, button');
        let target = null;
        for (const el of elements) {
            // Check if it looks like a file/folder (simple heuristic: has SVG child)
            const svgs = await el.$$('svg');
            if (svgs.length > 0) {
                target = el;
                break;
            }
        }

        if (target) {
            await target.click({ button: 'right' });
            await new Promise(r => setTimeout(r, 500)); // Wait for menu
            await page.screenshot({ path: path.join(OUTPUT_DIR, 'context_menu.png') });
        } else {
             // Fallback: Right click on body
             await page.mouse.click(640, 360, { button: 'right' });
             await new Promise(r => setTimeout(r, 500));
             await page.screenshot({ path: path.join(OUTPUT_DIR, 'context_menu_global.png') });
        }

    } catch (e) {
        console.error('Error during capture:', e);
    } finally {
        await browser.close();
        console.log('Done.');
    }
})();
