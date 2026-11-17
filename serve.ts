// A tiny static server for playing CLOCKWORK ASCENT locally: serves game/ at
// http://localhost:8080 with the right content types. Node 22, stdlib only.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "game");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};
const port = parseInt(process.env.PORT || "8080", 10);

createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  let path = join(root, url.pathname === "/" ? "index.html" : url.pathname);
  if (!path.startsWith(root) || !existsSync(path) || !statSync(path).isFile()) {
    res.writeHead(404); res.end("not found"); return;
  }
  res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" });
  res.end(readFileSync(path));
}).listen(port, () => console.log(`CLOCKWORK ASCENT at http://localhost:${port}`));
