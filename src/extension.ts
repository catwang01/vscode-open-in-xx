// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 使用双重日志确认扩展激活
	console.log('Extension "open-in-xx" is activated! Activation time: ' + new Date().toISOString());
	vscode.window.showInformationMessage('Extension "open-in-xx" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('open-in-xx.openInXX', async (uri?: vscode.Uri) => {
		// 添加日志记录命令被调用
		console.log('Command "open-in-xx.openInXX" was called.');
		
		try {
			// 如果没有 uri 参数，尝试获取当前文件或当前工作区
			if (!uri) {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor) {
					uri = activeEditor.document.uri;
				} else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
					uri = vscode.workspace.workspaceFolders[0].uri;
				} else {
					vscode.window.showErrorMessage('没有选择的文件或目录');
					return;
				}
			}

			const config = vscode.workspace.getConfiguration('openInXX');
			const programs = config.get<Record<string, string>>('programs', {});

			if (Object.keys(programs).length === 0) {
				const configMessage = '请在 settings.json 中配置程序。示例：\n{\n  "openInXX.programs": {\n    "Cursor": "cursor \\"${file}\\""\n  }\n}';
				const openSettings = '打开设置';
				
				const action = await vscode.window.showErrorMessage(configMessage, openSettings);
				if (action === openSettings) {
					await vscode.commands.executeCommand('workbench.action.openSettingsJson');
				}
				return;
			}

			const items = Object.keys(programs).map(label => ({ label }));
			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: '选择要使用的程序'
			});

			if (!selected) {
				return;
			}

			const command = programs[selected.label];
			const path = uri.fsPath;
			let isDirectory = false;
			
			try {
				const stat = await vscode.workspace.fs.stat(uri);
				isDirectory = stat.type === vscode.FileType.Directory;
			} catch (e) {
				// 如果获取状态失败，尝试通过路径判断
				isDirectory = !path.includes('.');
			}
			
			let finalCommand = command;
			
			if (command.includes('${file}')) {
				finalCommand = finalCommand.replace('${file}', isDirectory ? '' : path);
			}
			
			if (command.includes('${directory}')) {
				finalCommand = finalCommand.replace('${directory}', isDirectory ? path : path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '');
			}

			console.log(`Executing command: ${finalCommand}`);
			await execAsync(finalCommand);
			vscode.window.showInformationMessage(`已在 ${selected.label} 中打开`);
		} catch (error) {
			console.error('Error executing command:', error);
			vscode.window.showErrorMessage(`打开失败: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
