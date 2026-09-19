import * as vscode from "vscode";
import { generateCSS, getBodyClasses } from "./cssGenerator";
import { InstallationManager, InstallMethod } from "./installManager";

let installManager: InstallationManager;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration("vscodeFX");

  // === Determine install method ===
  let methodString = config.get<string>("installMethod") || "Custom CSS and JS";
  let method: InstallMethod =
    methodString === "Apc Customize UI++"
      ? InstallMethod.ApcCustomize
      : InstallMethod.CustomCSS;

  // First-time setup: detect installed helper
  const isFirstTime = !context.globalState.get<boolean>("vscodeFX.firstTime");
  if (isFirstTime) {
    const detected = await InstallationManager.detectMethod();
    if (detected) {
      method = detected;
      // Persist the detected method into settings
      await config.update("installMethod", detected, vscode.ConfigurationTarget.Global);
    }
    await context.globalState.update("vscodeFX.firstTime", true);
  }

  // Create manager
  installManager = new InstallationManager(method);

  // === Generate CSS/JS from current settings ===
  const { cssPath, jsPath } = generateCSS(context);

  // === Auto-install if enabled ===
  if (config.get<boolean>("autoInstall")) {
    // Skip helper check on subsequent activations — only prompt on first-time setup
    await installManager.install(cssPath, jsPath, !isFirstTime);
  }

  // === Listen for configuration changes ===
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (!e.affectsConfiguration("vscodeFX")) {
        return;
      }

      const updatedConfig = vscode.workspace.getConfiguration("vscodeFX");

      // If install method changed, switch methods
      if (e.affectsConfiguration("vscodeFX.installMethod")) {
        const newMethodString = updatedConfig.get<string>("installMethod") || "Custom CSS and JS";
        const newMethod: InstallMethod =
          newMethodString === "Apc Customize UI++"
            ? InstallMethod.ApcCustomize
            : InstallMethod.CustomCSS;
        await installManager.switchMethod(newMethod);
        return;
      }

      // For any other setting change, regenerate CSS and re-install
      const { cssPath: newCssPath, jsPath: newJsPath } = generateCSS(context);

      if (updatedConfig.get<boolean>("autoInstall")) {
        await installManager.install(newCssPath, newJsPath);

        const reload = await vscode.window.showInformationMessage(
          "VS Code FX: Effects updated. Reload to apply changes?",
          "Reload"
        );
        if (reload === "Reload") {
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      }
    })
  );

  // === Register commands ===

  // Enable All Effects
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeFX.enable", async () => {
      await config.update("enabled", true, vscode.ConfigurationTarget.Global);
      const { cssPath: p1, jsPath: p2 } = generateCSS(context);
      await installManager.install(p1, p2);
      const reload = await vscode.window.showInformationMessage(
        "VS Code FX: All effects enabled! Reload to apply.",
        "Reload"
      );
      if (reload === "Reload") {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    })
  );

  // Disable All Effects
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeFX.disable", async () => {
      await config.update("enabled", false, vscode.ConfigurationTarget.Global);
      const { cssPath: p1, jsPath: p2 } = generateCSS(context);
      await installManager.install(p1, p2);
      const reload = await vscode.window.showInformationMessage(
        "VS Code FX: All effects disabled. Reload to apply.",
        "Reload"
      );
      if (reload === "Reload") {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
    })
  );

  // Install / Reload Effects
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeFX.install", async () => {
      const { cssPath: p1, jsPath: p2 } = generateCSS(context);
      const success = await installManager.install(p1, p2);
      if (success) {
        const reload = await vscode.window.showInformationMessage(
          "VS Code FX: Effects installed! Reload to apply.",
          "Reload"
        );
        if (reload === "Reload") {
          await vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      }
    })
  );

  // Change Install Method
  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeFX.changeInstallMethod", async () => {
      const choice = await vscode.window.showQuickPick(
        [InstallMethod.CustomCSS, InstallMethod.ApcCustomize],
        {
          placeHolder: "Select CSS injection method",
        }
      );
      if (choice) {
        await config.update("installMethod", choice, vscode.ConfigurationTarget.Global);
        // The onDidChangeConfiguration listener will handle the switchMethod call
      }
    })
  );

  // === Status bar info ===
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = config.get<boolean>("enabled") ? "$(sparkle) FX" : "$(circle-slash) FX";
  statusBar.tooltip = "VS Code FX — Click to toggle";
  statusBar.command = config.get<boolean>("enabled") ? "vscodeFX.disable" : "vscodeFX.enable";
  statusBar.show();
  context.subscriptions.push(statusBar);

  // Log activation
  console.log("VS Code FX activated");
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
