const fs = require('fs');
const os = require('os');
const path = require('path');

const LOG_DIR =
  process.env.LRM_LOG_DIR ||
  path.join(process.env.APPDATA || os.homedir(), 'LocalResourceManager', 'logs');

function ensureDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function dayStamp(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

let currentDay = null;
let stream = null;

function openStreamForNow() {
  ensureDir();
  const now = new Date();
  const stamp = dayStamp(now);
  if (stream && currentDay === stamp) return;

  currentDay = stamp;
  try {
    if (stream) stream.end();
  } catch {}

  const filePath = path.join(LOG_DIR, `app-${stamp}.log`);
  stream = fs.createWriteStream(filePath, { flags: 'a' });
}

function safeStringify(v) {
  try {
    if (v instanceof Error) {
      return JSON.stringify(
        { name: v.name, message: v.message, stack: v.stack },
        null,
        0
      );
    }
    return JSON.stringify(v, null, 0);
  } catch {
    try {
      return String(v);
    } catch {
      return '[unprintable]';
    }
  }
}

function writeLine(level, parts) {
  openStreamForNow();
  const now = new Date();
  const ts = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())} ${pad2(
    now.getHours()
  )}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}.${String(now.getMilliseconds()).padStart(3, '0')}`;

  const msg = parts
    .map((p) => {
      if (typeof p === 'string') return p;
      return safeStringify(p);
    })
    .join(' ');

  const line = `${ts} [${level}] pid=${process.pid} ${msg}\n`;
  try {
    if (stream) stream.write(line);
  } catch {}
}

function info(...parts) {
  writeLine('INFO', parts);
}

function warn(...parts) {
  writeLine('WARN', parts);
}

function error(...parts) {
  writeLine('ERROR', parts);
}

function debug(...parts) {
  if (process.env.LRM_DEBUG === '1') writeLine('DEBUG', parts);
}

module.exports = { info, warn, error, debug, LOG_DIR };

