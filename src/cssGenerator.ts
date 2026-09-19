import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

/**
 * Reads all vscodeFX.* settings and generates combined CSS + JS output files.
 */
export function generateCSS(context: vscode.ExtensionContext): { cssPath: string; jsPath: string } {
  const config = vscode.workspace.getConfiguration("vscodeFX");
  const animDir = path.join(context.extensionPath, "src", "animations");
  const distDir = path.join(context.extensionPath, "dist");

  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  let css = "";
  let js = "";

  // If master toggle is off, write empty files
  if (!config.get<boolean>("enabled")) {
    writeDist(distDir, "", "");
    return { cssPath: path.join(distDir, "fx.css"), jsPath: path.join(distDir, "fx.js") };
  }

  // === Resolve colors (theme-aware) ===
  const accentColor = config.get<string>("uiPolish.accentColor") || config.get<string>("glow.color") || "";
  const speedMultiplier = getSpeedMultiplier(config.get<string>("animationSpeed") || "normal");

  // CSS custom properties root
  css += `:root {\n`;
  if (accentColor) {
    css += `  --fx-accent: ${accentColor};\n`;
  } else {
    css += `  --fx-accent: var(--vscode-focusBorder, #00bfff);\n`;
  }
  css += `  --fx-glow: color-mix(in srgb, var(--fx-accent) 24%, transparent);\n`;
  css += `  --fx-speed: ${Math.round(140 * speedMultiplier)}ms;\n`;

  // Durations
  const durations = {
    cursor: Math.round((config.get<number>("durations.cursor") || 200) * speedMultiplier),
    scrolling: Math.round((config.get<number>("durations.scrolling") || 200) * speedMultiplier),
    tabs: Math.round((config.get<number>("durations.tabs") || 300) * speedMultiplier),
    commandPalette: Math.round((config.get<number>("durations.commandPalette") || 300) * speedMultiplier),
    focusDimming: Math.round((config.get<number>("durations.focusDimming") || 200) * speedMultiplier),
    uiPolish: Math.round((config.get<number>("durations.uiPolish") || 140) * speedMultiplier),
  };

  css += `  --fx-cursor-duration: ${durations.cursor}ms;\n`;
  css += `  --fx-scroll-duration: ${durations.scrolling}ms;\n`;
  css += `  --fx-tab-duration: ${durations.tabs}ms;\n`;
  css += `  --fx-palette-duration: ${durations.commandPalette}ms;\n`;
  css += `  --fx-dim-duration: ${durations.focusDimming}ms;\n`;

  // Glow intensity
  const glowIntensity = config.get<string>("glow.intensity") || "normal";
  const glowValues = getGlowValues(glowIntensity);
  css += `  --fx-glow-spread: ${glowValues.spread};\n`;
  css += `  --fx-glow-inner: ${glowValues.inner};\n`;
  css += `  --fx-glow-outer-spread: ${glowValues.outerSpread};\n`;
  css += `  --fx-glow-outer: ${glowValues.outer};\n`;
  css += `  --fx-glow-border: ${glowValues.border};\n`;

  // Focus dimming amount
  const dimAmount = config.get<number>("focusDimming.amount") || 60;
  css += `  --fx-dim-amount: ${1 - dimAmount / 100};\n`;

  // Terminal dimming
  css += `  --fx-terminal-dim-opacity: 0.85;\n`;

  css += `}\n\n`;

  // === Add CSS class markers to body ===
  // The extension will add/remove classes on the body element
  // to toggle features. This approach avoids re-writing CSS files.

  // === Include base styles ===
  css += readAnimFile(animDir, "base.css");

  // === Glow ===
  if (config.get<boolean>("glow.enabled")) {
    css += readAnimFile(animDir, "glow.css");
    // If syntax token glow is enabled, we add the class marker
  }

  // === UI Polish ===
  if (config.get<boolean>("uiPolish.enabled")) {
    css += readAnimFile(animDir, "uiPolish.css");
  }

  // === Cursor ===
  if (config.get<boolean>("cursor.enabled")) {
    css += readAnimFile(animDir, "cursor.css");
  }

  // === Scrolling ===
  if (config.get<boolean>("scrolling.enabled")) {
    css += readAnimFile(animDir, "scrolling.css");
  }

  // === Tabs ===
  if (config.get<boolean>("tabs.enabled")) {
    css += readAnimFile(animDir, "tabs.css");
  }

  // === Command Palette ===
  if (config.get<boolean>("commandPalette.enabled")) {
    css += readAnimFile(animDir, "commandPalette.css");
  }

  // === Focus Dimming ===
  if (config.get<boolean>("focusDimming.enabled")) {
    css += readAnimFile(animDir, "focusDimming.css");
  }

  // === Active Indent ===
  if (config.get<boolean>("activeIndent.enabled")) {
    css += readAnimFile(animDir, "activeIndent.css");
  }

  // === Terminal ===
  if (config.get<boolean>("terminal.enabled")) {
    css += readAnimFile(animDir, "terminal.css");
  }

  // === Custom CSS ===
  const customCSS = config.get<string>("customCSS");
  if (customCSS) {
    css += `\n/* User Custom CSS */\n${customCSS}\n`;
  }

  // === Ripples JS ===
  if (config.get<boolean>("ripples.enabled")) {
    js = readAnimFile(animDir, "ripples.js");
  }

  writeDist(distDir, css, js);
  return { cssPath: path.join(distDir, "fx.css"), jsPath: path.join(distDir, "fx.js") };
}

/**
 * Generates the list of CSS class names to apply to the body element based on settings.
 */
export function getBodyClasses(config: vscode.WorkspaceConfiguration): string[] {
  const classes: string[] = [];

  if (config.get<boolean>("glow.syntaxTokens")) { classes.push("fx-syntax-glow"); }
  if (config.get<boolean>("uiPolish.enabled")) { classes.push("fx-ui-polish"); }
  if (config.get<boolean>("uiPolish.inputGlow")) { classes.push("fx-input-glow"); }
  if (config.get<boolean>("uiPolish.tabLift")) { classes.push("fx-tab-lift"); }

  // Cursor style
  if (config.get<boolean>("cursor.enabled")) {
    const style = config.get<string>("cursor.style") || "smooth";
    classes.push(`fx-cursor-${style}`);
  }

  // Scrolling style
  if (config.get<boolean>("scrolling.enabled")) {
    const style = config.get<string>("scrolling.style") || "slide";
    classes.push(`fx-scroll-${style}`);
  }

  // Tabs style
  if (config.get<boolean>("tabs.enabled")) {
    const style = config.get<string>("tabs.style") || "slide";
    classes.push(`fx-tabs-${style}`);
  }

  // Command Palette style
  if (config.get<boolean>("commandPalette.enabled")) {
    const style = config.get<string>("commandPalette.style") || "fade";
    classes.push(`fx-palette-${style}`);
  }

  // Focus Dimming
  if (config.get<boolean>("focusDimming.enabled")) {
    const mode = (config.get<string>("focusDimming.mode") || "Window").toLowerCase().replace(/\s+/g, "");
    classes.push(`fx-dim-${mode}`);
  }

  // Active Indent
  if (config.get<boolean>("activeIndent.enabled")) {
    const style = config.get<string>("activeIndent.style") || "indent";
    classes.push(`fx-indent-${style}`);
  }

  // Terminal
  if (config.get<boolean>("terminal.enabled")) {
    classes.push("fx-terminal");
    if (config.get<boolean>("terminal.focusDimming")) {
      classes.push("fx-terminal-dim");
    }
  }

  return classes;
}

function readAnimFile(animDir: string, filename: string): string {
  const filePath = path.join(animDir, filename);
  try {
    return fs.readFileSync(filePath, "utf-8") + "\n\n";
  } catch {
    return `/* Warning: Could not read ${filename} */\n`;
  }
}

function writeDist(distDir: string, css: string, js: string): void {
  fs.writeFileSync(path.join(distDir, "fx.css"), css, "utf-8");
  fs.writeFileSync(path.join(distDir, "fx.js"), js, "utf-8");
}

function getSpeedMultiplier(speed: string): number {
  switch (speed) {
    case "slow": return 1.5;
    case "fast": return 0.6;
    default: return 1.0;
  }
}

function getGlowValues(intensity: string): {
  spread: string; inner: string; outerSpread: string; outer: string; border: string;
} {
  switch (intensity) {
    case "subtle":
      return {
        spread: "4px", inner: "rgba(29, 169, 234, 0.2)",
        outerSpread: "6px", outer: "rgba(29, 169, 234, 0.1)",
        border: "rgba(29, 169, 234, 0.3)"
      };
    case "intense":
      return {
        spread: "14px", inner: "rgba(29, 169, 234, 0.6)",
        outerSpread: "20px", outer: "rgba(29, 169, 234, 0.35)",
        border: "rgba(29, 169, 234, 0.8)"
      };
    default: // normal
      return {
        spread: "8px", inner: "rgba(29, 169, 234, 0.4)",
        outerSpread: "12px", outer: "rgba(29, 169, 234, 0.2)",
        border: "rgba(29, 169, 234, 0.6)"
      };
  }
}
