# 🎀 Cutesy YouTube Music ♡

A cute little Windows desktop app whose sole purpose is to be a **YouTube Music** player —
with a soft pastel **pink & white** aesthetic. ✧

It wraps the real `music.youtube.com` in a frameless Electron window (so you get *every*
feature the website has) and reskins it into cuteness overload: bubbly rounded fonts, pink
hearts & sparkles, bouncy hover wiggles, glowy pink accents, and a fluffy pink scrollbar.

## ✨ Features

- 💖 Full YouTube Music — playback, search, library, playlists, your account
- 🌸 Pastel pink/white light-mode theme (no dark mode in sight)
- 🎀 Custom cutesy title bar with working minimize / maximize / close + drag
- 🩷 Pink logo, sparkle, hearts, and bouncy hover animations
- 🔐 Google sign-in works (login persists across restarts)

## 🚀 Getting started

```bash
npm install      # install dependencies
npm start        # run the app
npm run dist     # build a Windows installer (.exe) into dist/
```

## 🧁 Project structure

```
src/
├── main/index.js      # Electron main process: window, login fix, theme injection
├── preload/preload.js # window-control bridge for the title bar
└── renderer/
    ├── shell.html     # the custom cutesy title bar
    ├── titlebar.css   # title-bar styling
    └── pastel.css     # the whole pastel + cuteness-overload theme
assets/                # cute pink app icon
```

> The theme tracks YouTube Music's current markup — if the site is redesigned, `pastel.css`
> is the one file that may need touch-ups.

Made with 🩷 and a lot of pink.
