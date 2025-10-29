# 🎮 Rock Paper Scissors - Live Battle Simulation

> An HTML5 canvas-based rock-paper-scissors battle simulation where entities fight in real-time. Place your bet and watch the chaos unfold!

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-ff69b4)](https://lovable.dev)
[![Poki SDK](https://img.shields.io/badge/Poki-SDK%20v2-00D4FF)](https://poki.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)

---

## 🎯 About the Game

**Rock Paper Scissors Live Simulation** is a mesmerizing browser game where rock, paper, and scissors entities battle each other on an HTML5 canvas in real-time. 

### How to Play
1. **Choose your side**: Bet on rock 🪨, paper 📄, or scissors ✂️
2. **Watch the battle**: Entities spawn randomly and collide based on RPS rules
3. **Win the round**: Your chosen type must achieve total domination by eliminating all others
4. **Build streaks**: Chain victories to increase your win streak (persisted across sessions)

### Game Mechanics
- **Collision Detection**: When entities collide, the losing type converts to the winner
- **Victory Condition**: Total domination - one type eliminates all others
- **Juicy Effects**: Confetti explosions, slow-motion finishes, leader glow effects
- **Battle Stats**: Track collisions, duration, and performance
- **Speed Control**: Adjust simulation speed in real-time

---

## 📁 Project Structure

```
rock-paper-scissors/
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   └── assets/
│       └── total-arena-logo.png     # Game logo
├── src/
│   ├── pages/
│   │   ├── RockPaperScissors.tsx    # 🎮 Main game component (canvas, physics, UI)
│   │   └── NotFound.tsx              # 404 page
│   ├── hooks/
│   │   └── usePokiSDK.ts             # 🎬 Poki SDK integration (ads, analytics)
│   ├── components/
│   │   └── ui/                       # Shadcn UI components (Button, Slider, Card, etc.)
│   ├── lib/
│   │   └── utils.ts                  # Utility functions (cn, classNames)
│   ├── App.tsx                       # React Router setup
│   ├── main.tsx                      # App entry point + page jump prevention
│   └── index.css                     # Global styles + mobile optimizations
├── index.html                        # HTML entry point + Poki SDK script
├── vite.config.ts                    # Vite configuration
├── tailwind.config.ts                # Tailwind CSS config
└── package.json                      # Dependencies & build scripts
```

### Key Files Explained

| File | Purpose |
|------|---------|
| `src/pages/RockPaperScissors.tsx` | Core game logic, canvas rendering, physics simulation, UI |
| `src/hooks/usePokiSDK.ts` | Poki SDK wrapper (init, gameplayStart/Stop, ads) |
| `src/main.tsx` | App initialization, keyboard scroll prevention |
| `index.html` | HTML entry + Poki SDK `<script>` tag |
| `src/index.css` | Global styles, mobile layout fixes, animations |

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4 (fast HMR, optimized production builds)
- **Styling**: Tailwind CSS + shadcn-ui components
- **Animation**: HTML5 Canvas (requestAnimationFrame)
- **State Management**: React Hooks (useState, useRef, useEffect)
- **Routing**: React Router v6
- **SDK Integration**: Poki SDK v2 (ads, analytics, gameplay events)
- **Icons**: Lucide React
- **Deployment**: Lovable hosting + Poki.com

---

## 🚀 Development Setup

### Prerequisites
- **Node.js** 18+ ([Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **npm** or **bun** (package manager)

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install dependencies
npm install
# or
bun install

# 3. Start development server
npm run dev
# or
bun run dev
```

The app will be available at **http://localhost:8080**

---

## 📦 Build Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with HMR (port 8080) |
| `npm run build` | **Production build** (minified, optimized for Poki) |
| `npm run build:dev` | Development build (with source maps, debugging enabled) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on codebase |

---

## 🎮 Building for Poki.com

Follow these steps to prepare your game for Poki deployment:

### 1. Run Production Build
```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### 2. Verify Build Output
```
dist/
├── index.html              # Entry point
├── assets/
│   ├── index-[hash].js     # Bundled & minified JavaScript
│   ├── index-[hash].css    # Bundled & minified CSS
│   └── total-arena-logo-[hash].png
└── favicon.ico
```

### 3. Test Build Locally
```bash
npm run preview
```

Visit **http://localhost:4173** to test the production build.

### 4. Verify Poki SDK Integration

Open browser console and look for:
```
✅ Poki SDK successfully initialized
✅ 🎮 Poki: gameplayStart
✅ ☠ Poki: gameplayStop
✅ 🎞 Poki: commercialBreak started/finished
```

### 5. Upload to Poki Developer Portal

1. **Zip the `dist/` folder**:
   ```bash
   cd dist
   zip -r ../rock-paper-scissors-build.zip .
   ```

2. **Upload to Poki**:
   - Go to [Poki Developer Portal](https://developers.poki.com/)
   - Create new game or update existing
   - Upload `rock-paper-scissors-build.zip`
   - Test on Poki's preview environment

3. **Verify SDK Events**:
   - Poki will test that all required SDK events are firing correctly
   - Check that ads display properly (commercialBreak)
   - Ensure gameplay metrics are tracked

---

## 🎬 Poki SDK Integration

This game integrates **Poki SDK v2** for ads, analytics, and gameplay tracking.

### Implemented Events

| Event | Trigger Point | Purpose |
|-------|---------------|---------|
| `PokiSDK.init()` | App startup (usePokiSDK hook) | Initialize SDK |
| `PokiSDK.gameLoadingFinished()` | After SDK init | Signal game is ready |
| `PokiSDK.gameplayStart()` | Countdown finishes, game unpauses | Track active gameplay |
| `PokiSDK.gameplayStop()` | Game ends (victory), game pauses | Track gameplay interruption |
| `PokiSDK.commercialBreak()` | Before each new game (after bet) | Display interstitial ads |

### SDK Hook: `usePokiSDK`

Located in `src/hooks/usePokiSDK.ts`, this custom hook provides:
- ✅ Automatic SDK initialization
- ✅ `gameplayStart()` / `gameplayStop()` helpers
- ✅ `commercialBreak()` with callbacks (mute audio, pause input)
- ✅ `rewardedBreak()` for rewarded ads (not yet used)
- ✅ `isAdPlaying` state for UI overlays

### Testing SDK Events

**Local Development:**
- SDK may not show real ads in development
- Check browser console for event logs:
  ```
  🎮 Poki: gameplayStart
  ☠ Poki: gameplayStop
  🎞 Poki: commercialBreak started
  ```

**On Poki.com:**
- Real ads will display
- Verify no audio/input during ads
- Check ad placement feels natural (before game start)

---

## ✨ Game Features

- ⚡ **Real-time Physics**: 60 FPS canvas simulation with collision detection
- 🎮 **Strategic Betting**: Bet on rock, paper, or scissors before each round
- 🏆 **Win Streak System**: Track consecutive victories (persisted in localStorage)
- 🎉 **Victory Celebration**: Confetti explosions, slow-motion finishes, leader glow
- 📊 **Battle Statistics**: Track collisions, duration, entities remaining
- 🎯 **Responsive Design**: Optimized for desktop (1920x1080) and mobile (320px+)
- 🎨 **Modern UI**: shadcn-ui components, smooth animations, glassmorphism effects
- ⚙️ **Speed Control**: Adjust simulation speed in real-time (1-10x)
- 🚀 **Poki SDK**: Integrated ads, analytics, and gameplay tracking
- ⌨️ **Keyboard Shortcuts**: Space to pause/unpause
- 📱 **Touch Controls**: Mobile-friendly touch interactions

---

## 📱 Mobile Optimization

The game is fully responsive with specific mobile optimizations:

- **Vertical Layout**: HUD, canvas, and controls stack vertically
- **Compact HUD**: Logo scales to 96px (h-24) on mobile
- **Increased Spacing**: `space-y-6` (24px gaps) prevents overlap
- **Touch-Friendly**: Large tap targets, no hover-dependent UI
- **Scroll Prevention**: Arrow keys and space don't trigger page scroll
- **Optimized Canvas**: Scaled rendering for mobile performance

Mobile-specific CSS is in `src/index.css` under `@media (max-width: 420px)`.

---

## 🚢 Deployment Options

### 1. Lovable Hosting (Default)
- **URL**: https://lovable.dev/projects/cde9e99c-5b2f-4e33-a897-a7aa3309c892
- **Staging**: `yourproject.lovable.app`
- **Custom Domain**: Available in Project Settings → Domains

### 2. Poki.com Deployment
- **Build**: `npm run build`
- **Upload**: Zip `dist/` folder → upload to Poki Developer Portal
- **Review**: Poki QA team reviews SDK integration

### 3. Self-Hosting
- Build with `npm run build`
- Upload `dist/` contents to any static hosting (Vercel, Netlify, GitHub Pages)
- Ensure proper MIME types for `.js` and `.css` files

---

## 🐛 Troubleshooting

### Poki SDK not initializing
- Check browser console for errors
- Verify `<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>` is in `index.html`
- Ensure `PokiSDK.init()` is called in `usePokiSDK.ts`

### Canvas not rendering
- Check canvas element ID is `canvas` in `RockPaperScissors.tsx`
- Verify `useEffect` for canvas initialization is running
- Check browser console for Canvas API errors

### Mobile layout issues
- Inspect mobile-specific CSS in `src/index.css` (`@media (max-width: 420px)`)
- Verify `mobile-gameplay-layout` class is applied
- Check viewport meta tag in `index.html`

### Build errors
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node -v` (should be 18+)
- Run `npm run lint` to catch TypeScript errors

---

## 📄 License

Built with [Lovable](https://lovable.dev) - The AI-powered web app builder.

Integrated with [Poki SDK](https://poki.com/developers) for ads and analytics.

---

## 🤝 Contributing

This project was created with Lovable. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🔗 Links

- **Play Live**: [Lovable Deployment](https://lovable.dev/projects/cde9e99c-5b2f-4e33-a897-a7aa3309c892)
- **Lovable Docs**: https://docs.lovable.dev/
- **Poki Developer Docs**: https://developers.poki.com/
- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/

---

Made with ❤️ using [Lovable](https://lovable.dev)
