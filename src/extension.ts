import { fsync } from 'fs';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SidebarProvider } from './sidebarProvider';
import { Client } from 'pg';
import axios from 'axios';
import { stringify } from 'querystring';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "vscode-explain" is now active!');

	// const sidebarProvider = new SidebarProvider(context.extensionUri);
	// context.subscriptions.push(
	// 	vscode.window.registerWebviewViewProvider(
	// 		"explain-view",
	// 		sidebarProvider
	// 	)
	// );

	let connectCommand = vscode.commands.registerCommand('vscode-explain.connect', async (name) => {
		const connectionString = await vscode.window.showInputBox({
			placeHolder: 'Enter connection string, e.g. postgres://user:password@localhost:5432/dbname',
			value: ''
		}) as string;

		//vscode.workspace.getConfiguration().update('vscode-explain.connectionString', connectionString);
		context.globalState.update('vscode-explain.connectionString', connectionString);
	});

	let explainCommand = vscode.commands.registerTextEditorCommand('vscode-explain.explain', async (textEditor, edit) => {
		const selection = textEditor.selection;
		let text = textEditor.document.getText(selection) as string;
		text = text.replace(/(\r\n|\n|\r)/gm, " ");
		//add explain to the query
		text = `EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) ${text}`;

		//let connectionString = vscode.workspace.getConfiguration().get('vscode-explain.connectionString') as string;
		let connectionString = context.globalState.get('vscode-explain.connectionString') as string;

		if (!connectionString) {
			vscode.window.showErrorMessage('vscode-explain.connectionString is not set');
			//show input box to set connection string for postgres DB
			connectionString = await vscode.window.showInputBox({
				placeHolder: 'Enter connection string, e.g. postgres://user:password@localhost:5432/dbname',
				value: ''
			}) as string;

			if (!connectionString) {
				vscode.window.showErrorMessage('vscode-explain.connectionString is not set');
				return;
			}

			//vscode.workspace.getConfiguration().update('vscode-explain.connectionString', connectionString);
			context.globalState.update('vscode-explain.connectionString', connectionString);
		}

		const client = new Client(connectionString);
		let result;

		try {
			console.log('connecting to db');
			await client.connect();
			console.log('connected to db');
			result = await client.query(text);
			await client.end();
		} catch (err: any) {
			console.log(err);
			vscode.window.showErrorMessage(err.message);
			return;
		}

		const firstRow = result.rows[0];
		const plan = JSON.stringify(firstRow['QUERY PLAN']);
		//vscode.env.openExternal(vscode.Uri.parse(`https://archaicdebugger.github.io/pev2/?query=${text}&plan=${plan}`));

		let data = stringify({
			'title': 'Generated with VSCode Explain',
			'plan': plan,
			'query': text
		});

		let config = {
			method: 'post',
			url: 'https://explain.dalibo.com/new.json',
			data : data
		};

		const response: any = await axios.request(config);
		console.log(response.data.id);

		vscode.env.openExternal(vscode.Uri.parse(`https://explain.dalibo.com/plan/${response.data.id}`));

		//open the sidebar registered above
		//sidebarProvider._view?.show();
	});

	context.subscriptions.push(explainCommand);
	context.subscriptions.push(connectCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}

//postgres://vinkurushi:restart.Pass1@127.0.0.1:5432/appbuilder_development_onit-test?options=-c search_path=appbuilder
