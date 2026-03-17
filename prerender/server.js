'use strict';

const express = require('express');
const puppeteer = require('puppeteer-core');

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://web:80';
const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10); // seconds

const app = express();

// Simple in-memory LRU-ish cache (max 200 entries)
const cache = new Map();
const MAX_CACHE = 200;

function cacheSet(key, value) {
  if (cache.size >= MAX_CACHE) {
    // Evict oldest entry
    cache.delete(cache.keys().next().value);
  }
  cache.set(key, { html: value, ts: Date.now() });
}

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if ((Date.now() - entry.ts) / 1000 > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.html;
}

let browser;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ],
  });
  browser.on('disconnected', () => { browser = null; });
  return browser;
}

app.get('/render', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('Missing ?url=');

  // Rewrite external URL to internal frontend container
  let internalUrl;
  try {
    const parsed = new URL(targetUrl);
    internalUrl = `${FRONTEND_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return res.status(400).send('Invalid URL');
  }

  const cached = cacheGet(internalUrl);
  if (cached) {
    res.set('X-Prerender-Cache', 'HIT');
    return res.set('Content-Type', 'text/html').send(cached);
  }

  let page;
  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setRequestInterception(true);
    page.on('request', (r) => {
      const type = r.resourceType();
      // Skip heavy resources that don't affect HTML content
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        r.abort();
      } else {
        r.continue();
      }
    });

    await page.goto(internalUrl, {
      waitUntil: 'networkidle0',
      timeout: 25000,
    });

    // Wait for main content to render (React root)
    await page.waitForSelector('#root > *', { timeout: 10000 }).catch(() => {});

    const html = await page.content();
    cacheSet(internalUrl, html);

    res.set('X-Prerender-Cache', 'MISS');
    res.set('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('Prerender error:', err.message);
    res.status(500).send('Prerender failed');
  } finally {
    if (page) await page.close().catch(() => {});
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', cached: cache.size }));

app.listen(PORT, () => console.log(`Prerender listening on :${PORT}`));
