const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load environment variables
require('dotenv').config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY environment variable is required');
    process.exit(1);
}

// Error handling helper
function handleStreamError(res, error, status = 500) {
    console.error('Error:', error);
    const errorMessage = {
        error: {
            message: error.message || 'Internal server error',
            type: error.type || 'server_error'
        }
    };
    res.write(`data: ${JSON.stringify(errorMessage)}\n\n`);
    res.write(`data: ${JSON.stringify({ text: '[DONE]' })}\n\n`);
    res.end();
}

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

    // Serve the HTML file for any path that ends with test-stream.html
    if (pathname === '/' || pathname.endsWith('test-stream.html')) {
        const htmlPath = path.join(__dirname, 'test-stream.html');
        console.log('Current directory (__dirname):', __dirname);
        console.log('Current working directory (cwd):', process.cwd());
        console.log('Attempting to serve HTML file from:', htmlPath);
        console.log('File exists:', fs.existsSync(htmlPath));
        console.log('Attempting to serve HTML file from:', htmlPath);
        
        try {
            const content = fs.readFileSync(htmlPath);
            console.log('Successfully read HTML file');
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
            });
            res.end(content);
        } catch (err) {
            console.error('Error reading HTML file:', err);
            res.writeHead(500);
            res.end('Error loading test-stream.html');
        }
        return;
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

        try {
            // Parse query parameters
            const urlParams = new URLSearchParams(parsedUrl.query || '');
            const messages = JSON.parse(urlParams.get('messages') || '[]');
            const options = JSON.parse(urlParams.get('options') || '{}');

            console.log('Processing request with model:', options.model || 'default');
            
            // Prepare OpenRouter request
            const openRouterReq = https.request({
                hostname: 'openrouter.ai',
                path: '/api/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3009',
                    'X-Title': 'LLM Service Test',
                    'OpenAI-Beta': 'assistants=v1'
                }
            }, (openRouterRes) => {
                console.log('OpenRouter response status:', openRouterRes.statusCode);

                if (openRouterRes.statusCode !== 200) {
                    let errorData = '';
                    openRouterRes.on('data', chunk => errorData += chunk);
                    openRouterRes.on('end', () => {
                        try {
                            const error = JSON.parse(errorData);
                            handleStreamError(res, {
                                message: error.error?.message || 'OpenRouter API error',
                                type: 'api_error',
                                status: openRouterRes.statusCode
                            });
                        } catch (e) {
                            handleStreamError(res, {
                                message: 'Failed to parse error response',
                                type: 'parse_error'
                            });
                        }
                    });
                    return;
                }

                openRouterRes.on('data', (chunk) => {
                    // pipe the data directly to the response
                    res.write(chunk);
                });
                
                openRouterRes.on('end', () => {
                    res.write(`data: ${JSON.stringify({ text: '[DONE]' })}\n\n`);
                    res.end();
                    console.log('Stream completed successfully');
                });
            });
            
            openRouterReq.on('error', (error) => {
                console.error('OpenRouter request error:', error);
                handleStreamError(res, {
                    message: error.message,
                    type: 'network_error'
                });
            });
            
            // Send the request
            const requestBody = {
                model: options.model || 'anthropic/claude-3.5-sonnet',
                messages: messages,
                stream: true,
                ...options
            };
            console.log('Sending request with body:', JSON.stringify(requestBody));
            openRouterReq.write(JSON.stringify(requestBody));
            openRouterReq.end();
        } catch (error) {
            console.error('Server error:', error);
            handleStreamError(res, {
                message: 'Internal server error',
                type: 'server_error'
            });
        }
        
        // Handle client disconnect
        req.on('close', () => {
            console.log('Client disconnected');
        });
    } else {
        console.log('Path not found:', pathname);
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = 3009;  // Match the port used in test-stream.html
server.listen(PORT, () => {
    console.log(`Test server running at http://localhost:${PORT}`);
    console.log(`Try accessing the test page at:`);
    console.log(`- http://localhost:${PORT}`);
    console.log(`- http://localhost:${PORT}/test-stream.html`);
});