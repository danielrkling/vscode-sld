import vscode from "vscode";
import { formatter } from "./formatter";

// import { ExtensionContext, Uri } from 'vscode';
// import { LanguageClientOptions } from 'vscode-languageclient';

import { type LanguageClient } from 'vscode-languageclient/browser';

let client: LanguageClient | undefined;



export async function activate(context: vscode.ExtensionContext) {

	// const documentSelector = [{ language: 'plaintext' }];

	// // Options to control the language client
	// const clientOptions: LanguageClientOptions = {
	// 	documentSelector,
	// 	synchronize: {},
	// 	initializationOptions: {}
	// };

	// client = createWorkerLanguageClient(context, clientOptions);

	// await client.start();

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


export async function deactivate(): Promise<void> {
	if (client !== undefined) {
		await client.stop();
	}
}

// function createWorkerLanguageClient(context: ExtensionContext, clientOptions: LanguageClientOptions) {
// 	// Create a worker. The worker main file implements the language server.
// 	const serverMain = Uri.joinPath(context.extensionUri, 'dist/server.js');
// 	const worker = new Worker(serverMain.toString(true));

// 	// create the language server client to communicate with the server running in the worker
// 	return new LanguageClient('lsp-web-extension-sample', 'LSP Web Extension Sample', clientOptions, worker);
// }