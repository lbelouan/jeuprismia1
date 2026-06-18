# Prismia Tower

A canvas-based skill-stacking game. Drop a swinging block onto the previous one — line them up perfectly to chain bonuses, miss too often and the run ends.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:8082`.

## Scripts

- `npm run build` — bundle the game for production into `dist/main.js`
- `npm run dev` — watch-mode development build
- `npm run serve` — start the local web server (uses the existing build)

## Project layout

- `src/` — game logic and canvas rendering modules
- `assets/` — static assets served as-is
- `dist/` — bundled output (committed for direct hosting)
- `index.html` — landing markup, game shell, and bootstrap script
- `server.js` — local Express server
