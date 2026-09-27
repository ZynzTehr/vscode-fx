import * as vscode from "vscode";

const MARKETPLACE_REVIEW_URL =
  "https://marketplace.visualstudio.com/items?itemName=VSCodeFX.vscode-fx&ssr=false#review-details";

// State keys stored in globalState
const KEY_INSTALL_DATE = "vscodeFX.installDate";
const KEY_ACTIVATION_COUNT = "vscodeFX.activationCount";
const KEY_NUDGE_DISMISSED = "vscodeFX.nudgeDismissed";

// Show the nudge after 3 days AND 5 activations (so the user has actually used it)
const MIN_DAYS = 3;
const MIN_ACTIVATIONS = 5;

/**
 * Checks whether it's time to show a gentle rating nudge.
 * Conditions:
 *  - Extension installed for at least MIN_DAYS days
 *  - Extension activated at least MIN_ACTIVATIONS times
 *  - User hasn't previously dismissed or already rated
 */
export async function maybeShowRatingNudge(
  context: vscode.ExtensionContext
): Promise<void> {
  const state = context.globalState;

  // Already dismissed — never show again
  if (state.get<boolean>(KEY_NUDGE_DISMISSED)) {
    return;
  }

  // Record first-ever activation date
  let installDate = state.get<number>(KEY_INSTALL_DATE);
  if (!installDate) {
    installDate = Date.now();
    await state.update(KEY_INSTALL_DATE, installDate);
  }

  // Bump activation count
  const count = (state.get<number>(KEY_ACTIVATION_COUNT) || 0) + 1;
  await state.update(KEY_ACTIVATION_COUNT, count);

  // Check thresholds
  const daysSinceInstall = (Date.now() - installDate) / (1000 * 60 * 60 * 24);
  if (daysSinceInstall < MIN_DAYS || count < MIN_ACTIVATIONS) {
    return;
  }

  // Show the nudge
  const choice = await vscode.window.showInformationMessage(
    "Enjoying VS Code FX? A quick rating on the Marketplace helps others discover it ⭐",
    "Rate It",
    "Remind Me Later",
    "Don't Ask Again"
  );

  if (choice === "Rate It") {
    await vscode.env.openExternal(vscode.Uri.parse(MARKETPLACE_REVIEW_URL));
    await state.update(KEY_NUDGE_DISMISSED, true);
  } else if (choice === "Don't Ask Again") {
    await state.update(KEY_NUDGE_DISMISSED, true);
  } else {
    // "Remind Me Later" or dismissed — reset activation count so it shows again
    // after another MIN_ACTIVATIONS
    await state.update(KEY_ACTIVATION_COUNT, 0);
  }
}
