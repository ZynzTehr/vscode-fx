import * as vscode from "vscode";
import * as path from "path";

/** Supported CSS injection helper extensions */
export enum InstallMethod {
  CustomCSS = "Custom CSS and JS",
  ApcCustomize = "Apc Customize UI++",
}

interface MethodConfig {
  extensionID: string;
  extensionName: string;
  importSetting: string;
  installCommand: string;
  uninstallCommand: string;
}

const METHOD_MAP: Record<InstallMethod, MethodConfig> = {
  [InstallMethod.CustomCSS]: {
    extensionID: "be5invis.vscode-custom-css",
    extensionName: "Custom CSS and JS Loader",
    importSetting: "vscode_custom_css.imports",
    installCommand: "extension.installCustomCSS",
    uninstallCommand: "extension.uninstallCustomCSS",
  },
  [InstallMethod.ApcCustomize]: {
    extensionID: "drcika.apc-extension",
    extensionName: "Apc Customize UI++",
    importSetting: "apc.imports",
    installCommand: "apc.extension.enable",
    uninstallCommand: "apc.extension.disable",
  },
};

export class InstallationManager {
  private method: InstallMethod;

  constructor(method: InstallMethod) {
    this.method = method;
  }

  /** Get the current method config */
  private get config(): MethodConfig {
    return METHOD_MAP[this.method];
  }

  /** Convert an OS file path to a file:// URI */
  private toFileUri(filePath: string): string {
    // Normalize path separators to forward slashes
    let normalized = filePath.replace(/\\/g, "/");

    // Windows drive letter: C:/... → file:///C:/...
    if (/^[A-Za-z]:\//.test(normalized)) {
      return `file:///${normalized}`;
    }

    // Unix/macOS: /Users/... → file:///Users/...
    if (normalized.startsWith("/")) {
      return `file://${normalized}`;
    }

    return `file:///${normalized}`;
  }

  /**
   * Check if the helper extension is installed.
   * If not, prompt the user to install it.
   * Returns true if the helper is available (or skipCheck is true).
   */
  private async ensureHelperInstalled(skipCheck: boolean = false): Promise<boolean> {
    // If we've already been set up, skip the detection — just proceed.
    // This avoids re-prompting on every reload in VS Code forks where
    // vscode.extensions.getExtension() may not detect the helper.
    if (skipCheck) {
      return true;
    }

    const ext = vscode.extensions.getExtension(this.config.extensionID);
    if (ext) {
      return true;
    }

    const choice = await vscode.window.showWarningMessage(
      `VS Code FX requires "${this.config.extensionName}" to inject CSS/JS. Install it now?`,
      "Install",
      "Cancel"
    );

    if (choice === "Install") {
      await vscode.commands.executeCommand(
        "workbench.extensions.installExtension",
        this.config.extensionID
      );
      const reload = await vscode.window.showInformationMessage(
        `"${this.config.extensionName}" installed. Please reload VS Code to activate it.`,
        "Reload"
      );
      if (reload === "Reload") {
        await vscode.commands.executeCommand("workbench.action.reloadWindow");
      }
      return false;
    }

    return false;
  }

  /**
   * Install generated CSS/JS into VS Code via the helper extension.
   * Pass skipCheck=true to bypass the helper extension detection prompt.
   */
  async install(cssPath: string, jsPath: string, skipCheck: boolean = false): Promise<boolean> {
    const available = await this.ensureHelperInstalled(skipCheck);
    if (!available) {
      return false;
    }

    const cssUri = this.toFileUri(cssPath);
    const jsUri = this.toFileUri(jsPath);

    const vsConfig = vscode.workspace.getConfiguration();
    const currentImports: string[] = vsConfig.get<string[]>(this.config.importSetting) || [];

    // Remove any existing fx.css / fx.js entries
    const filtered = currentImports.filter(
      (uri) => !uri.includes("fx.css") && !uri.includes("fx.js")
    );

    // Add new entries
    filtered.push(cssUri, jsUri);

    // Update the setting globally
    await vsConfig.update(this.config.importSetting, filtered, vscode.ConfigurationTarget.Global);

    // Execute the helper's install command
    try {
      await vscode.commands.executeCommand(this.config.installCommand);
    } catch (err) {
      vscode.window.showErrorMessage(
        `Failed to run "${this.config.installCommand}": ${err}`
      );
      return false;
    }

    return true;
  }

  /**
   * Uninstall: remove fx entries and execute the helper's uninstall command.
   */
  async uninstall(): Promise<void> {
    const vsConfig = vscode.workspace.getConfiguration();
    const currentImports: string[] = vsConfig.get<string[]>(this.config.importSetting) || [];

    const filtered = currentImports.filter(
      (uri) => !uri.includes("fx.css") && !uri.includes("fx.js")
    );

    await vsConfig.update(this.config.importSetting, filtered, vscode.ConfigurationTarget.Global);

    try {
      await vscode.commands.executeCommand(this.config.uninstallCommand);
    } catch {
      // Silent — the extension might not be installed
    }
  }

  /**
   * Switch to a different install method. Uninstalls from the old method first.
   */
  async switchMethod(newMethod: InstallMethod): Promise<void> {
    // Uninstall from current method
    await this.uninstall();

    // Switch
    this.method = newMethod;

    const reload = await vscode.window.showInformationMessage(
      `Switched to "${newMethod}". Please reload VS Code and run "VS Code FX: Install / Reload Effects".`,
      "Reload"
    );

    if (reload === "Reload") {
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }

  /**
   * Auto-detect which helper extension is installed and set the method accordingly.
   * If neither is installed, prompt the user to pick one.
   * Returns the detected/chosen method, or null if user cancelled.
   */
  static async detectMethod(): Promise<InstallMethod | null> {
    // Check if Custom CSS is installed
    const customCss = vscode.extensions.getExtension(
      METHOD_MAP[InstallMethod.CustomCSS].extensionID
    );
    if (customCss) {
      return InstallMethod.CustomCSS;
    }

    // Check if Apc is installed
    const apc = vscode.extensions.getExtension(
      METHOD_MAP[InstallMethod.ApcCustomize].extensionID
    );
    if (apc) {
      return InstallMethod.ApcCustomize;
    }

    // Neither installed — prompt user to pick
    const choice = await vscode.window.showInformationMessage(
      "VS Code FX needs a CSS injection helper. Which would you like to use?",
      InstallMethod.CustomCSS,
      InstallMethod.ApcCustomize
    );

    if (!choice) {
      return null;
    }

    return choice as InstallMethod;
  }
}
