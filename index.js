const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const http = require('http');
const url = require('url');

const port = 3001;

async function takeScreenshot(targetUrl) {
    let browser = null;
    
    try {
        // Configure Chromium
        await chromium.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');

        // Launch the browser
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });

        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({ width: 600, height: 488 });

        await page.goto(targetUrl, {
            waitUntil: 'networkidle2'
        });

        // Ensure fonts are loaded
        await page.waitForFunction('document.fonts.ready');

        const screenshot = await page.screenshot({ encoding: 'base64' });

        // HTML content with the embedded screenshot
        const htmlContent = `
            <html>
            <body>
                <h1>Screenshot of ${targetUrl}</h1>
                <img src="data:image/png;base64,${screenshot}" alt="Screenshot">
            </body>
            </html>
        `;

        return htmlContent;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    } finally {
        if (browser !== null) {
            await browser.close();
        }
    }
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/screenshot') {
        const targetUrl = parsedUrl.query.url;

        if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('URL parameter is required');
            return;
        }

        try {
            const htmlContent = await takeScreenshot(targetUrl);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(htmlContent);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('An error occurred while taking the screenshot');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});