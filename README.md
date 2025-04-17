# open-in-xx

一个 VSCode 扩展，允许你在任何配置的程序中打开文件/目录。

## 功能

- 在文件/目录的上下文菜单中添加"Open in Program"选项
- 支持配置多个程序
- 支持文件和目录路径变量

## 安装

### 从源码安装

1. 克隆仓库
2. 运行 `npm install` 安装依赖
3. 运行 `npm run compile` 编译扩展
4. 按 F5 启动调试，或者使用 `vsce package` 打包成 vsix 文件安装

## 配置

在 VSCode 的 settings.json 中添加以下配置：

```json
{
  "openInXX.programs": {
    "Cursor": "cursor \"${file}\"",
    "Terminal": "open -a Terminal \"${directory}\"",
    "Sublime Text": "subl \"${file}\""
  }
}
```

### 变量说明

- `${file}`: 文件路径
- `${directory}`: 目录路径

## 使用方法

1. 在文件资源管理器中右键点击文件或目录
2. 选择 "Open in Program"
3. 从弹出的列表中选择要使用的程序

## 故障排除

如果右键菜单中没有显示 "Open in Program" 选项，请尝试以下步骤：

1. 确保扩展已激活：打开命令面板（Cmd+Shift+P），输入 "Developer: Reload Window" 重新加载窗口
2. 检查配置：打开 settings.json 确保 `openInXX.programs` 配置正确
3. 检查日志：打开输出面板（View > Output），选择 "Log (Window)"，查看是否有错误信息
4. 尝试重新安装扩展

## 已知问题

暂无

## 更新日志

### 0.0.1

- 初始版本
- 支持在配置的程序中打开文件/目录

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: Enable/disable this extension.
* `myExtension.thing`: Set to `blah` to do something.

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
