
const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES = [
    {
        pageUrl: 'https://commons.wikimedia.org/wiki/File:China_Railways_SS6B-6002_in_Guangzhou_Railway_Museum_20220520-01.jpg',
        filename: 'gz_museum_ss6b.jpg'
    },
    {
        pageUrl: 'https://commons.wikimedia.org/wiki/File:Building_Huizhounan.jpg',
        filename: 'huizhou_station_old.jpg'
    }
];

const DOWNLOAD_DIR = path.join(__dirname, 'extension', 'public', 'wallpapers');

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        }, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

function fetchPageAndGetImageUrl(pageUrl) {
    return new Promise((resolve, reject) => {
        https.get(pageUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Look for "Original file" link or class="internal"
                // Pattern: <a href="https://upload.wikimedia.org/wikipedia/commons/2/25/China_Railways_SS6B-6002_in_Guangzhou_Railway_Museum_20220520-01.jpg" class="internal"
                const match = data.match(/href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+)"\s+class="internal"/);
                if (match && match[1]) {
                    resolve(match[1]);
                } else {
                    // Fallback: try to find any upload.wikimedia.org link that ends with .jpg and doesn't contain /thumb/
                    const fallbackMatch = data.match(/href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]+\.jpg)"/);
                     if (fallbackMatch && fallbackMatch[1] && !fallbackMatch[1].includes('/thumb/')) {
                        resolve(fallbackMatch[1]);
                    } else {
                        reject(new Error(`Could not find image URL in ${pageUrl}`));
                    }
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Starting download process...');
    
    for (const img of IMAGES) {
        try {
            console.log(`Processing ${img.filename}...`);
            const imageUrl = await fetchPageAndGetImageUrl(img.pageUrl);
            console.log(`Found URL: ${imageUrl}`);
            const destPath = path.join(DOWNLOAD_DIR, img.filename);
            await downloadFile(imageUrl, destPath);
            console.log(`Downloaded to ${destPath}`);
        } catch (err) {
            console.error(`Error processing ${img.filename}:`, err.message);
        }
    }
    
    console.log('Done!');
}

main();
