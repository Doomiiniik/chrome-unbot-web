# Chrome Unbot — Browser Fingerprinting & Bot-Likeness Scanner

A lightweight tool that analyzes browser fingerprint signals and scores how "bot-like" a browser appears — the same category of technique used by real anti-fraud and bot-detection systems (e.g. Cloudflare, DataDome).

**Live Demo:** [chromeunbot.doomiiniik.dev](https://chromeunbot.doomiiniik.dev)

## How It Works

The client-side script collects a set of browser fingerprint signals and sends them to the backend for scoring:

- WebRTC availability (real ICE candidate negotiation test)
- Canvas rendering fingerprint (drawing + reading back pixel data)
- WebGL availability
- AudioContext availability
- Hardware concurrency (CPU core count)
- Device memory
- Navigator entropy (plugin count, MIME type count)

Each blocked or suspicious signal adds points to a 0–100 "bot-likeness" score, based on the logic that real human browsers rarely disable these APIs — while automated browsers (e.g. hardened Puppeteer/Selenium profiles) often do, to hide their automation.

The result includes the score, a human-readable interpretation, a list of triggered risk factors, and suggested fixes.

## Architecture
Browser (client fingerprint collection)
→ POST /analyze
→ Express backend (scoring logic)
→ JSON response (score, reasons, fixes)

## Tech Stack

- Node.js + Express (backend, fingerprint scoring)
- Vanilla JavaScript (client-side fingerprint collection)
- HTML/CSS (demo UI)

## Project Note

This started as a Chrome extension concept (see `extension/`) but was ultimately shipped as a standalone web tool, since that made the demo easier to share and test without requiring an install.

---
Author: Dominik — built to explore browser fingerprinting and anti-bot detection techniques.
