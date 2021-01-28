const vscode = require('vscode');
var fetch = require("node-fetch");

let urlLookup = new Object();

function activate(context) {

    console.log('Congratulations, your extension "star-rod" is now active!');
    // https://www.chrishasz.com/blog/2020/07/28/vscode-how-to-use-local-storage-api/#:~:text=the%20Memento%20class%20in%20the,tune%20how%20you%20store%20data.
    //const storage = context.globalState


    fetch(`https://api.github.com/repos/MarlinFirmware/MarlinDocumentation/contents/_gcode`)
        .then(res => res.json())
        .then(body => parseRepoContents(body))
        .catch((error) => console.log(error));

    disposable = vscode.languages.registerHoverProvider('gcode', {
        async provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // format the word correctly
            const regex = /\s*([A-Za-z])(\d+)\s*/
            const matches = word.match(regex);
            if(!isNaN(matches[2]))
            {
                const lookup = matches[1] + matches[2].padStart(3,"0");
                if (urlLookup[lookup] != null)
                {
                    // Can get the contents of the repo here. Need to parse out the hypenated entries (like G000-G001) to make a lookup
                    //https://api.github.com/repos/MarlinFirmware/MarlinDocumentation/contents/_gcode
                    const url = urlLookup[lookup];
                    /*
                    const prommise = fetch(url)
                        .then(res => res.text())
                        .then(body => {
                            const hoverText = parseDocs(body)
                            return new vscode.Hover({value: "hoverText"});
                        })
                        .catch((error) => console.log(error));
    
                    await promise;
                    */

                    try {
                        const response = await fetch(url);
                        const json = await response.text();
                        const hoverText = parseDocs(json);
                        return new vscode.Hover(hoverText);
                    } catch (error) {
                        console.log(error);
                    }

               await promise;

                    return promise;
                }
            }

            return;
        }
    });    

    context.subscriptions.push(disposable);
}

function deactivate() { }

function parseRepoContents(json)
{
    json.forEach(element => {
        const filename = element.name.split(".")[0];
        const numberParts = filename.split("-");
        numberParts.forEach(numberPart => {
            urlLookup[numberPart] = element.download_url;
        });
    });
}

function parseDocs(text) 
{
    const title = text.match(/title: ([^\n]*)/)[1];
    const brief = text.match(/brief: ([^\n]*)/)[1];
    return new vscode.MarkdownString(`**${title}** \n\n ${brief}`);

}

module.exports = {
    activate,
    deactivate
}