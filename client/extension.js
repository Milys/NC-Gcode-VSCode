const vscode = require('vscode');
var fetch = require("node-fetch");

var urlLookup;

function activate(context) {

    console.log('GCode hover text is active');

    if (urlLookup == null)
    {
        console.debug('Fetching cache of documentation');
        urlLookup = new Object();
        fetch(`https://api.github.com/repos/MarlinFirmware/MarlinDocumentation/contents/_gcode`)
        .then(res => res.json())
        .then(body => parseRepoContents(body))
        .catch((error) => console.log(error));
    }

    disposable = vscode.languages.registerHoverProvider('gcode', {
        async provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            // format the word correctly
            const regex = /\s*([A-Za-z])(\d+)\s*/
            const matches = word.match(regex);
            // If the second part is a number then search the lookup for the documentation
            if(!isNaN(matches[2]))
            {
                // Format the string correctly (i.e. with leading zeros)
                const lookup = matches[1] + matches[2].padStart(3,"0");
                const rawInfoUrl = urlLookup[lookup].download_url;
                if (rawInfoUrl != null)
                {
                    try {
                        const response = await fetch(rawInfoUrl);
                        const json = await response.text();
                        const docs = parseDocs(json);
                        const hoverText = `**${docs.title}** \n\n ${docs.brief} \n\n <${urlLookup[lookup].docs_url}>`
                        return new vscode.Hover(hoverText);
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        }
    });    

    context.subscriptions.push(disposable);
}

function deactivate() { }

function parseRepoContents(json)
{
    json.forEach(element => {
        const filename = element.name.split(".")[0];
        const download_url = element.download_url;
        const docs_url = `https://marlinfw.org/docs/gcode/${filename}.html`;

        const regex = /([A-Za-z])(\d+)(?:-([A-Za-z])(\d+))?/;
        const matches = filename.match(regex);

        // remove the global match
        matches.shift();

        for (i = 0; i <= matches.length/2; i+=2) {
            urlLookup[matches[i] + matches[i+1]] = {
                download_url: download_url,
                docs_url: docs_url,
            };
        }
    });
}

function parseDocs(text) 
{
    return {
        title:text.match(/title: ([^\n]*)/)[1],
        brief:text.match(/brief: ([^\n]*)/)[1]};
}

module.exports = {
    activate,
    deactivate
}