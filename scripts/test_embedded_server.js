import http from 'http';
import fs from 'fs';
import path from 'path';

// Load .dev.vars
const devVars = {};
if (fs.existsSync('.dev.vars')) {
  for (const line of fs.readFileSync('.dev.vars', 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx > 0) devVars[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
}

const workerModule = await import('../src/index.js');
const worker = workerModule.default;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  const pathname = parsedUrl.pathname;

  // Handle API requests via worker
  if (pathname.startsWith('/api/') || pathname.startsWith('/media/')) {
    try {
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
      }
      
      let body = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = Buffer.concat(chunks);
      }

      const webReq = new Request(parsedUrl.href, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : body
      });

      const webRes = await worker.fetch(webReq, devVars);
      
      const resHeaders = {};
      webRes.headers.forEach((val, key) => {
        if (key.toLowerCase() === 'set-cookie') {
          resHeaders['Set-Cookie'] = resHeaders['Set-Cookie'] || [];
          resHeaders['Set-Cookie'].push(val);
        } else {
          resHeaders[key] = val;
        }
      });

      res.writeHead(webRes.status, resHeaders);
      const resBuf = Buffer.from(await webRes.arrayBuffer());
      res.end(resBuf);
      return;
    } catch (err) {
      console.error('[API Error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
      return;
    }
  }

  // Handle Static files from public/
  let filePath = path.join(process.cwd(), 'public', pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(process.cwd(), 'public', 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (err) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(8999, '127.0.0.1', async () => {
  console.log('Embedded server started on http://127.0.0.1:8999');
  
  // Test fetching /api/subjects
  const apiRes = await fetch('http://127.0.0.1:8999/api/subjects');
  const apiData = await apiRes.json();
  console.log('Test /api/subjects success:', apiData.subjects?.length, 'subjects found!');

  // Test fetching /styles.css
  const cssRes = await fetch('http://127.0.0.1:8999/styles.css');
  console.log('Test /styles.css status:', cssRes.status, 'Content-Type:', cssRes.headers.get('content-type'));

  server.close();
  console.log('Test finished successfully!');
});
