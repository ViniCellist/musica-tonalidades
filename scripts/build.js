import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..')
const dist = path.resolve(root, 'dist')

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })

const toCopy = ['index.html', 'app.js', 'styles.css', 'images', 'json']
for (const item of toCopy) {
  const src = path.resolve(root, item)
  const dst = path.resolve(dist, item)
  fs.cpSync(src, dst, { recursive: true })
}

console.log('Build gerada em /dist')
