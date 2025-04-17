# open-in-xx

A VSCode extension that allows you to open files/directories in any configured program.

## Features

- Adds "Open in Program" option to file/directory context menus
- Supports configuration of multiple programs
- Supports file and directory path variables
- Default programs based on your operating system

## Installation

### From Source

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the extension
4. Press F5 to start debugging, or use `vsce package` to package as a vsix file for installation

## Configuration

Add the following configuration to VSCode's settings.json:

```json
{
  "openInXX.programs": {
    "Cursor": "cursor \"${item}\"",
    "Terminal": "open -a Terminal \"${directory}\"",
    "Sublime Text": "subl \"${file}\""
  }
}
```

### Variables

- `${item}`: Path to the selected file or directory
- `${file}`: File path (legacy, use `${item}` instead)
- `${directory}`: Directory path (legacy, use `${item}` instead)

### Advanced Configuration

You can also specify different commands for files and directories:

```json
{
  "openInXX.programs": {
    "VS Code": {
      "file": "code \"${item}\"",
      "directory": "code -n \"${item}\""
    },
    "Explorer": {
      "directory": "explorer \"${item}\"",
      "file": "explorer /select,\"${item}\""
    }
  }
}
```

## Usage

1. Right-click a file or directory in the Explorer
2. Select "Open in XX"
3. Choose a program from the popup list

You can also use the "Open the root folder in XX" command to open the workspace root directory.

## Troubleshooting

If the "Open in XX" option does not appear in the context menu, try these steps:

1. Make sure the extension is activated: Open the command palette (Cmd+Shift+P), type "Developer: Reload Window"
2. Check configuration: Open settings.json and ensure `openInXX.programs` is correctly configured
3. Check logs: Open the Output panel (View > Output), select "Open in XX" to check for error messages
4. Try reinstalling the extension

## Known Issues

None at this time.

## Changelog

### 0.0.1

- Initial release
- Support for opening files/directories in configured programs
- Default program configurations based on operating system

## Requirements

VSCode 1.74.0 or higher.

## Extension Settings

This extension contributes the following settings:

* `openInXX.programs`: Configure programs to open files/directories with. Can be a string command or an object with 'file' and 'directory' properties.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
