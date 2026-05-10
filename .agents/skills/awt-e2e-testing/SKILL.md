---
name: awt-e2e-testing
description: "Runs AI-powered end-to-end web tests from declarative YAML scenarios, executing them with Playwright and verifying with visual matching (OpenCV + OCR) plus platform auto-detection (Flutter / React / Vue). Use when the user asks to ‘write an E2E test in YAML’, wants visual + DOM assertions in one step, or needs a learning-DB-backed self-healing flow. Install: npx skills add ksgisang/awt-skill --skill awt -g"
risk: unknown
source: "https://github.com/ksgisang/awt-skill"
---

# AWT — AI-Powered E2E Testing (Beta)

> `npx skills add ksgisang/awt-skill --skill awt -g`

AWT gives AI coding tools the ability to see and interact with web applications through a real browser. Your AI designs YAML test scenarios; AWT executes them with Playwright.

## What works now
- YAML scenarios → Playwright with human-like interaction
- Visual matching: OpenCV template + OCR (no CSS selectors needed)
- Platform auto-detection: Flutter, React, Next.js, Vue, Angular, Svelte
- Structured failure diagnosis with investigation checklists
- Learning DB: failure→fix patterns in SQLite
- 5 AI providers: Claude, OpenAI, Gemini, DeepSeek, Ollama
- Skill Mode: no extra AI API key needed

## Links
- Main repo: https://github.com/ksgisang/AI-Watch-Tester
- Skill repo: https://github.com/ksgisang/awt-skill
- Cloud demo: https://ai-watch-tester.vercel.app

Built with the help of AI coding tools — and designed to help AI coding tools test better.
