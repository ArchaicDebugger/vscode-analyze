import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export class SidebarProvider implements vscode.WebviewViewProvider {
    _view?: vscode.WebviewView;
    _doc?: vscode.TextDocument;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // Listen for messages from the Sidebar component and execute action
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "connect": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showInformationMessage(data.value);
                    break;
                }
                case "onError": {
                    if (!data.value) {
                        return;
                    }
                    vscode.window.showErrorMessage(data.value);
                    break;
                }
            }
        });

    }

    public revive(panel: vscode.WebviewView) {
        this._view = panel;
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const connectionHtml = fs.readFileSync(
            path.join(this._extensionUri.fsPath, "src", "components", "connection.html")
        );

        // get connections from storage
        const connections = [{
            name: "test",
            connString: "test",
            isActive: true
        }, {
            name: "test2",
            connString: "test2",
            isActive: false
        }, {
            name: "test3",
            connString: "test3",
            isActive: false
        }];

        const connectionList = connections.map((connection) => {
            return connectionHtml.toString().replace(/\{name\}/g, connection.name).replace(/\{connString\}/g, connection.connString).replace(/\{isActive\}/g, connection.isActive ? "active" : "");
        }).join("");

        let html = fs.readFileSync(
            path.join(this._extensionUri.fsPath, "src", "panels", "connections.html")
        ).toString();

        html = html.replace(/\{connections\}/g, connectionList);

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return html.replace(/\{nonce\}/g, nonce);
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
