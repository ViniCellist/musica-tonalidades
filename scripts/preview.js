import http from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..', 'dist')
const port = 4173

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

http
  .createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0])
    if (reqPath === '/') reqPath = '/index.html'
    const target = path.resolve(root, `.${reqPath}`)

    if (!target.startsWith(root) || !existsSync(target) || statSync(target).isDirectory()) {
      res.writeHead(404)
      res.end('Not found')
      return
    }

    res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' })
    createReadStream(target).pipe(res)
  })
  .listen(port, '0.0.0.0', () => {
    console.log(`Preview em http://localhost:${port}`)
  })
