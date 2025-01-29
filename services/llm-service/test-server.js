const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const server = http.createServer((req, res) => {
    console.log(`Received request for: ${req.url}`);

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Last-Event-ID');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Last-Event-ID');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse the URL
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname;

    // Serve the HTML file for both root and direct file access
    if (pathname === '/' || pathname === '/test-stream.html' || pathname === '/services/llm-service/test-stream.html') {
        fs.readFile(path.join(__dirname, 'test-stream.html'), (err, content) => {
            if (err) {
                console.error('Error reading HTML file:', err);
                res.writeHead(500);
                res.end('Error loading test-stream.html');
                return;
            }
            console.log('Serving HTML file');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } 
    // Handle the stream endpoint
    else if (pathname === '/api/v1/llm/complete/stream') {
        console.log('Handling stream request');
        // Set headers for SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Parse the query parameters to get the message
        const urlParams = new URLSearchParams(parsedUrl.query || '');
        let messages;
        try {
            messages = JSON.parse(urlParams.get('messages') || '[]');
        } catch (error) {
            console.error('Error parsing messages:', error);
            messages = [];
        }
        const userMessage = messages[0]?.content || 'No message provided';

        console.log('Processing message:', userMessage);

        // Send a test response stream
        let messageCount = 0;
        const interval = setInterval(() => {
            if (messageCount < 5) {
                const data = {
                    text: `Chunk ${messageCount + 1} for message: "${userMessage}"\n`
                };
                res.write(`data: ${JSON.stringify(data)}\n\n`);
                messageCount++;
                console.log(`Sent chunk ${messageCount}`);
            } else {
                // Send completion signal
                res.write(`data: ${JSON.stringify({ text: '[DONE]' })}\n\n`);
                clearInterval(interval);
                res.end();
                console.log('Stream completed');
            }
        }, 1000);

        // Handle client disconnect
        req.on('close', () => {
            clearInterval(interval);
            console.log('Client disconnected');
        });
    } else {
        console.log('Path not found:', pathname);
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = 3009;  // Changed to a different port
server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
    console.log(`Try accessing the test page at:`);
    console.log(`- http://localhost:${PORT}`);
    console.log(`- http://localhost:${PORT}/test-stream.html`);
});