# VS Code FX

**Premium animations, neon glows, ripple effects, and smooth motion for VS Code.**

Theme-aware. Fully customizable. Zero configuration needed.

---

## Features

| Effect | Description |
|--------|-------------|
| **Neon Glow** | Active line glow + syntax token text-shadow with adjustable intensity |
| **Ripple Effects** | Material Design ripple on clicks — tabs, buttons, menus |
| **UI Polish** | Hover lifts, input glow, accent highlights, scrollbar styling |
| **Smooth Cursor** | Smooth / trail / fade cursor movement animations |
| **Scrolling** | Slide or fade content into view as you scroll |
| **Tab Animations** | Slide, fade, or scale tabs on open/close |
| **Command Palette** | Fade, scale, or slideDown entrance animation |
| **Focus Dimming** | Dim unfocused panes — Window, Column, or Full Window modes |
| **Active Indent** | Highlight active line with indent, scale, or fade effects |
| **Terminal FX** | Glow borders, focus dimming, and ripples in the terminal |

All effects respect `prefers-reduced-motion` and high-contrast themes.

---

## Installation

1. Install **VS Code FX** from the Extensions Marketplace
2. Install one of the required CSS injection helpers:
   - [Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) *(recommended)*
   - [Apc Customize UI++](https://marketplace.visualstudio.com/items?itemName=drcika.apc-extension)
3. Run the command **VS Code FX: Install / Reload Effects** from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
4. Reload VS Code when prompted

> **Note:** VS Code FX will auto-detect your helper extension on first launch. If neither is installed, it will prompt you to choose one.

---

## Settings

All settings are available in **Settings UI** under `Extensions > VS Code FX`.

### Global

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.enabled` | `true` | Master toggle — enable/disable all effects |
| `vscodeFX.installMethod` | `Custom CSS and JS` | CSS injection helper to use |
| `vscodeFX.autoInstall` | `true` | Auto re-install when settings change |
| `vscodeFX.animationSpeed` | `normal` | Global speed: `slow` / `normal` / `fast` |

### Neon Glow

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.glow.enabled` | `true` | Neon glow on active editor line |
| `vscodeFX.glow.syntaxTokens` | `true` | Text-shadow glow on syntax tokens |
| `vscodeFX.glow.intensity` | `normal` | `subtle` / `normal` / `intense` |
| `vscodeFX.glow.color` | *(auto)* | Custom hex color or auto-detect from theme |

### Ripple Effects

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.ripples.enabled` | `true` | Material Design ripple on clicks |
| `vscodeFX.ripples.color` | *(auto)* | Custom hex color or auto-detect |

### UI Polish

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.uiPolish.enabled` | `true` | Hover effects and accent highlights |
| `vscodeFX.uiPolish.tabLift` | `true` | Tabs lift on hover |
| `vscodeFX.uiPolish.inputGlow` | `true` | Glow on focused inputs |
| `vscodeFX.uiPolish.accentColor` | *(auto)* | Custom accent hex color |

### Cursor

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.cursor.enabled` | `true` | Smooth cursor movement |
| `vscodeFX.cursor.style` | `smooth` | `smooth` / `trail` / `fade` |

### Scrolling

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.scrolling.enabled` | `true` | Smooth scrolling animation |
| `vscodeFX.scrolling.style` | `slide` | `slide` / `fade` |

### Tabs

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.tabs.enabled` | `true` | Tab open/close animation |
| `vscodeFX.tabs.style` | `slide` | `slide` / `fade` / `scale` |

### Command Palette

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.commandPalette.enabled` | `true` | Palette entrance animation |
| `vscodeFX.commandPalette.style` | `fade` | `fade` / `scale` / `slideDown` |

### Focus Dimming

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.focusDimming.enabled` | `false` | Dim unfocused panes |
| `vscodeFX.focusDimming.amount` | `60` | 0 (none) to 100 (fully dimmed) |
| `vscodeFX.focusDimming.mode` | `Window` | `Window` / `Column` / `Full Window` |

### Active Indent

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.activeIndent.enabled` | `true` | Active line animation |
| `vscodeFX.activeIndent.style` | `indent` | `indent` / `scale` / `fade` |

### Terminal

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.terminal.enabled` | `true` | Terminal effects |
| `vscodeFX.terminal.focusDimming` | `true` | Dim terminal when unfocused |
| `vscodeFX.terminal.panelGlow` | `true` | Glow border when focused |

### Durations (ms)

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.durations.cursor` | `200` | Cursor animation speed |
| `vscodeFX.durations.scrolling` | `200` | Scroll animation speed |
| `vscodeFX.durations.tabs` | `300` | Tab animation speed |
| `vscodeFX.durations.commandPalette` | `300` | Palette animation speed |
| `vscodeFX.durations.focusDimming` | `200` | Dimming transition speed |
| `vscodeFX.durations.uiPolish` | `140` | Hover/focus effect speed |

### Advanced

| Setting | Default | Description |
|---------|---------|-------------|
| `vscodeFX.customCSS` | *(empty)* | Additional custom CSS to inject |

---

## Commands

| Command | Description |
|---------|-------------|
| `VS Code FX: Enable All Effects` | Turn on all effects |
| `VS Code FX: Disable All Effects` | Turn off all effects |
| `VS Code FX: Install / Reload Effects` | Re-generate and inject CSS/JS |
| `VS Code FX: Change Install Method` | Switch between CSS injection helpers |

---

## How It Works

VS Code FX generates custom CSS and JavaScript based on your settings, then injects them into VS Code's UI via a helper extension ([Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) or [Apc Customize UI++](https://marketplace.visualstudio.com/items?itemName=drcika.apc-extension)).

When you change a setting:
1. CSS/JS is regenerated from your current configuration
2. The helper extension's imports are updated
3. VS Code reloads to apply changes

All animations use CSS custom properties and class toggles, making them lightweight and performant.

---

## Accessibility

- All animations respect `prefers-reduced-motion: reduce`
- High contrast themes disable glow and decorative effects
- Focus indicators remain visible at all times
- No seizure-inducing patterns or rapid flashing

---

## Contributing

Contributions welcome! Please open an issue or PR on the [GitHub repository](https://github.com/vscode-fx/vscode-fx).

---

## License

[MIT](LICENSE)
