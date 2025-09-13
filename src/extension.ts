import vscode from "vscode";
import { formatter } from "./formatter";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "vscode-sld" is now active!');

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      "javascript",
      formatter
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      "typescript",
      formatter
    )
  );
}

export function deactivate() {}
