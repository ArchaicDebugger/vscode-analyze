import { fsync } from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SidebarProvider } from './sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-explain" is now active!');

	const sidebarProvider = new SidebarProvider(context.extensionUri);
		context.subscriptions.push(
			vscode.window.registerWebviewViewProvider(
				"explain-view",
				sidebarProvider
			)
		);

	let connectCommand = vscode.commands.registerCommand('vscode-explain.connect', (name) => {
		vscode.window.showInformationMessage(`Connecting to ${name}`);
	});

	let explainCommand = vscode.commands.registerTextEditorCommand('vscode-explain.explain', (textEditor, edit) => {
		const selection = textEditor.selection;
		const text = textEditor.document.getText(selection);

		const connectionString = vscode.workspace.getConfiguration().get('vscode-explain.connectionString');
		if (!connectionString) {
			vscode.window.showErrorMessage('vscode-explain.connectionString is not set');
			//show input box to set connection string for postgres DB
			vscode.window.showInputBox({
				placeHolder: 'Enter connection string, e.g. postgres://user:password@localhost:5432/dbname',
				value: ''
			}).then(value => {
				if (value) {
					vscode.workspace.getConfiguration().update('vscode-explain.connectionString', value, true);
				}
			});
		}

		//send the query to the server
		vscode.window.showInformationMessage(`Explain query: ${text}`);


		//open the sidebar registered above
		sidebarProvider._view?.show();
	});

	context.subscriptions.push(explainCommand);
	context.subscriptions.push(connectCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
