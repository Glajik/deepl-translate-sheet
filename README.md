# Deepl-translate-sheet

## Quick start
Copy and paste contents from file dist/main.js to your google apps script project.
Then save, and refresh spreadsheet.

### Setup:
To setup your DeepL API key - go to DeepL -> Update API key in main menu

### Usage:
Go to DeepL -> Translate

## Development (for windows)

### Install Git
Download and install from site:
https://git-scm.com/download/win

Direct link:
https://github.com/git-for-windows/git/releases/download/v2.25.0.windows.1/Git-2.25.0-32-bit.exe

### Install NodeJS
Download and install from site:
https://nodejs.org/en/

Direct link:
https://nodejs.org/dist/v12.15.0/node-v12.15.0-x64.msi


### Install Clasp
- Launch command line interface (cmd.exe)
- Run command:
```
npm install @google/clasp -g
```

### Clone project
With the command line interface run commands:

```
git clone https://github.com/Glajik/deepl-translate-sheet.git
cd deepl-translate-sheet
```

### Copy template spreadsheet
- Make copy of original spreadsheet
- Go to Tools -> Script editor from main menu
- At opened editor, go File -> Project properties, and copy Script ID
- At project folder "deepl-translate-sheet" on local computer, find
file clasp.json and update it with your script ID

Example of clasp.json file:
```
{"scriptId":"1ABCDyJcHseGwBPTZYSod0-LwgwPQLEYljB-CUzXYUZCwtFrEHhABUG3P"}
``` 

### Deploy
```
npm i
clasp push
```

