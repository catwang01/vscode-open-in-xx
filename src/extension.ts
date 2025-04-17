// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

// 程序配置类型定义
type ProgramConfig = string | {
	file?: string;
	directory?: string;
};

// 根据操作系统返回默认程序
function getDefaultPrograms(): Record<string, ProgramConfig> {
	const platform = os.platform();
	
	// macOS 默认程序
	if (platform === 'darwin') {
		return {
			'Finder': {
				directory: 'open "${item}"',
				file: 'open -R "${item}"'
			},
			'VS Code': 'code "${item}"',
			'Terminal': 'open -a Terminal "${item}"'
		};
	}
	
	// Windows 默认程序
	if (platform === 'win32') {
		return {
			'Explorer': {
				directory: 'explorer "${item}"',
				file: 'explorer /select,"${item}"'
			},
			'VS Code': 'code "${item}"',
			'Command Prompt': 'cmd.exe /K cd /d "${item}"'
		};
	}
	
	// Linux 默认程序
	return {
		'File Manager': 'xdg-open "${item}"',
		'VS Code': 'code "${item}"',
		'Terminal': 'x-terminal-emulator --working-directory="${item}"'
	};
}

// 获取合并了默认配置的程序列表
function getPrograms(): Record<string, ProgramConfig> {
	const config = vscode.workspace.getConfiguration('openInXX');
	const userPrograms = config.get<Record<string, ProgramConfig>>('programs', {});
	
	// 合并默认配置和用户配置，用户配置优先
	const mergedPrograms = { ...getDefaultPrograms() };
	
	// 用户配置会覆盖默认配置
	for (const key in userPrograms) {
		mergedPrograms[key] = userPrograms[key];
	}
	
	return mergedPrograms;
}

// 创建一个输出通道
let outputChannel: vscode.OutputChannel;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// 初始化输出通道
	outputChannel = vscode.window.createOutputChannel('Open in XX');
	context.subscriptions.push(outputChannel);
	
	// 记录扩展激活信息
	outputChannel.appendLine(`Extension "open-in-xx" is activated! Activation time: ${new Date().toISOString()}`);
	outputChannel.show(true); // 显示输出窗口，参数 true 表示不强制获取焦点

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('open-in-xx.openInXX', async (uri?: vscode.Uri) => {
		// 添加日志记录命令被调用
		outputChannel.appendLine(`Command "open-in-xx.openInXX" was called at ${new Date().toISOString()}`);
		
		try {
			// 如果没有 uri 参数，尝试获取当前文件或当前工作区
			if (!uri) {
				const activeEditor = vscode.window.activeTextEditor;
				if (activeEditor) {
					uri = activeEditor.document.uri;
				} else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
					// 如果没有活动编辑器，则使用工作区的根目录
					uri = vscode.workspace.workspaceFolders[0].uri;
					outputChannel.appendLine(`没有选中任何项目，默认使用工作区根目录: ${uri.fsPath}`);
				} else {
					vscode.window.showErrorMessage('没有选择的文件或目录，也没有打开的工作区');
					return;
				}
			}

			// 获取实时合并后的程序配置
			const programs = getPrograms();
			outputChannel.appendLine(`获取到 ${Object.keys(programs).length} 个可用程序配置`);

			if (Object.keys(programs).length === 0) {
				const configMessage = '请在 settings.json 中配置程序。示例：\n{\n  "openInXX.programs": {\n    "Cursor": "cursor \\"${item}\\"",\n    "VS Code": {\n      "file": "code \\"${item}\\"",\n      "directory": "code -n \\"${item}\\""\n    }\n  }\n}';
				const openSettings = '打开设置';
				
				const action = await vscode.window.showErrorMessage(configMessage, openSettings);
				if (action === openSettings) {
					await vscode.commands.executeCommand('workbench.action.openSettingsJson');
				}
				return;
			}

			const itemPath = uri.fsPath;
			let isDirectory = false;
			
			try {
				const stat = await vscode.workspace.fs.stat(uri);
				isDirectory = stat.type === vscode.FileType.Directory;
			} catch (e) {
				// 如果获取状态失败，尝试通过路径判断
				isDirectory = !itemPath.includes('.');
			}

			// 筛选出支持当前类型的程序
			const filteredPrograms: Record<string, ProgramConfig> = {};
			for (const [name, config] of Object.entries(programs)) {
				if (typeof config === 'string') {
					// 字符串配置对文件和目录都有效
					filteredPrograms[name] = config;
				} else {
					// 对象配置，根据当前类型进行筛选
					if (isDirectory && config.directory) {
						filteredPrograms[name] = config;
					} else if (!isDirectory && config.file) {
						filteredPrograms[name] = config;
					}
				}
			}

			if (Object.keys(filteredPrograms).length === 0) {
				vscode.window.showErrorMessage(`没有可用于${isDirectory ? '目录' : '文件'}的程序配置`);
				return;
			}

			outputChannel.appendLine(`筛选后获取到 ${Object.keys(filteredPrograms).length} 个适用于${isDirectory ? '目录' : '文件'}的程序配置`);

			const items = Object.keys(filteredPrograms).map(label => ({ label }));
			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: `选择要使用的程序（适用于${isDirectory ? '目录' : '文件'}）`
			});

			if (!selected) {
				return;
			}

			const programConfig = programs[selected.label];
			
			// 决定使用哪个命令
			let commandTemplate: string;
			
			if (typeof programConfig === 'string') {
				// 如果是字符串，则对文件和目录都使用相同的命令
				commandTemplate = programConfig;
			} else {
				// 如果是对象，则根据是文件还是目录选择对应的命令
				if (isDirectory && programConfig.directory) {
					commandTemplate = programConfig.directory;
				} else if (!isDirectory && programConfig.file) {
					commandTemplate = programConfig.file;
				} else if (isDirectory && !programConfig.directory && programConfig.file) {
					// 没有目录专用命令但有文件命令，对目录使用文件命令
					commandTemplate = programConfig.file;
				} else if (!isDirectory && !programConfig.file && programConfig.directory) {
					// 没有文件专用命令但有目录命令，对文件使用目录命令
					commandTemplate = programConfig.directory;
				} else {
					vscode.window.showErrorMessage(`未配置适用于${isDirectory ? '目录' : '文件'}的命令`);
					return;
				}
			}
			
			// 替换模板中的 ${item}
			let finalCommand = commandTemplate.replace(/\${item}/g, itemPath);
			
			// 兼容旧版本的 ${file} 和 ${directory}
			if (finalCommand.includes('${file}')) {
				finalCommand = finalCommand.replace('${file}', isDirectory ? '' : itemPath);
			}
			
			if (finalCommand.includes('${directory}')) {
				finalCommand = finalCommand.replace('${directory}', isDirectory ? itemPath : itemPath.includes('/') ? itemPath.substring(0, itemPath.lastIndexOf('/')) : '');
			}

			outputChannel.appendLine(`Executing command: ${finalCommand}`);
			await execAsync(finalCommand);
			vscode.window.showInformationMessage(`已在 ${selected.label} 中打开`);
		} catch (error) {
			outputChannel.appendLine(`Error executing command: ${error}`);
			vscode.window.showErrorMessage(`打开失败: ${error}`);
		}
	});

	context.subscriptions.push(disposable);

	// 命令：在根目录打开
	let openRootDisposable = vscode.commands.registerCommand('open-in-xx.openRootFolderInXX', async () => {
		outputChannel.appendLine(`Command "open-in-xx.openRootFolderInXX" was called at ${new Date().toISOString()}`);
		
		try {
			// 获取工作区根目录
			if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('没有打开的工作区');
				return;
			}
			
			const rootUri = vscode.workspace.workspaceFolders[0].uri;
			outputChannel.appendLine(`使用工作区根目录: ${rootUri.fsPath}`);
			
			// 获取实时合并后的程序配置
			const programs = getPrograms();
			outputChannel.appendLine(`获取到 ${Object.keys(programs).length} 个可用程序配置`);

			if (Object.keys(programs).length === 0) {
				const configMessage = '请在 settings.json 中配置程序。示例：\n{\n  "openInXX.programs": {\n    "Cursor": "cursor \\"${item}\\"",\n    "VS Code": {\n      "file": "code \\"${item}\\"",\n      "directory": "code -n \\"${item}\\""\n    }\n  }\n}';
				const openSettings = '打开设置';
				
				const action = await vscode.window.showErrorMessage(configMessage, openSettings);
				if (action === openSettings) {
					await vscode.commands.executeCommand('workbench.action.openSettingsJson');
				}
				return;
			}

			// 根目录肯定是目录类型
			const isDirectory = true;
			const itemPath = rootUri.fsPath;

			// 筛选出支持目录的程序
			const filteredPrograms: Record<string, ProgramConfig> = {};
			for (const [name, config] of Object.entries(programs)) {
				if (typeof config === 'string') {
					// 字符串配置对文件和目录都有效
					filteredPrograms[name] = config;
				} else if (config.directory) {
					// 对象配置，只保留有目录配置的
					filteredPrograms[name] = config;
				}
			}

			if (Object.keys(filteredPrograms).length === 0) {
				vscode.window.showErrorMessage('没有可用于目录的程序配置');
				return;
			}

			outputChannel.appendLine(`筛选后获取到 ${Object.keys(filteredPrograms).length} 个适用于目录的程序配置`);

			const items = Object.keys(filteredPrograms).map(label => ({ label }));
			const selected = await vscode.window.showQuickPick(items, {
				placeHolder: '选择要使用的程序（适用于目录）'
			});

			if (!selected) {
				return;
			}

			const programConfig = programs[selected.label];
			
			// 决定使用哪个命令
			let commandTemplate: string;
			
			if (typeof programConfig === 'string') {
				// 如果是字符串，则对文件和目录都使用相同的命令
				commandTemplate = programConfig;
			} else if (programConfig.directory) {
				// 使用目录专用命令
				commandTemplate = programConfig.directory;
			} else if (programConfig.file) {
				// 没有目录专用命令但有文件命令，对目录使用文件命令
				commandTemplate = programConfig.file;
			} else {
				vscode.window.showErrorMessage('未配置适用于目录的命令');
				return;
			}
			
			// 替换模板中的 ${item}
			let finalCommand = commandTemplate.replace(/\${item}/g, itemPath);
			
			// 兼容旧版本的 ${file} 和 ${directory}
			if (finalCommand.includes('${file}')) {
				finalCommand = finalCommand.replace('${file}', '');
			}
			
			if (finalCommand.includes('${directory}')) {
				finalCommand = finalCommand.replace('${directory}', itemPath);
			}

			outputChannel.appendLine(`Executing command: ${finalCommand}`);
			await execAsync(finalCommand);
			vscode.window.showInformationMessage(`已在 ${selected.label} 中打开工作区根目录`);
		} catch (error) {
			outputChannel.appendLine(`Error executing command: ${error}`);
			vscode.window.showErrorMessage(`打开失败: ${error}`);
		}
	});

	context.subscriptions.push(openRootDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (outputChannel) {
		outputChannel.appendLine('Extension "open-in-xx" is deactivated');
		outputChannel.dispose();
	}
}
