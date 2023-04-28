import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-explain" is now active!');

	let explainCommand = vscode.commands.registerTextEditorCommand('vscode-explain.explain', (textEditor, edit) => {
		const selection = textEditor.selection;
		const text = textEditor.document.getText(selection);


	});

	context.subscriptions.push(explainCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
