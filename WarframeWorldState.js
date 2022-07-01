// An example from https://wfcd.github.io/warframe-worldstate-parser/index.html
// Deprecated API to give warframe world state data.
// At least the URL is correct.

//const worldstateData = await (require('request-promise'))('http://content.warframe.com/dynamic/worldState.php');
const axios = require('axios');

// const fs = require('fs');
// function readFile(fileName) {
//     return new Promise((resolve, reject) => {
//         //console.log(test);
//         fs.readFile(fileName, 'utf8', function (err, data) {
//             if (err) return reject(err);
//             console.log('Reading '+fileName);
//             resolve();
//         })
//     });
// }

const { promises: fs } = require("fs");

(async () => {
    try {
        //const response = await axios.get('http://content.warframe.com/dynamic/worldState.php');
        let fileData = await fs.readFile('C:/Dev/temp/worldstate.json', 'utf-8');
        let data = JSON.parse(fileData);
        console.log(data.Events.length+' ongoing events.');
        const events = data.Events.filter( (n,i) => {
            return n.Messages[0].LanguageCode === 'en';
        });
        console.log(events.length + ' english events.');
        //const WorldState = require('warframe-worldstate-parser');
        //const ws = new WorldState(response.data);
        //console.log(ws.alerts[0].toString());
    } catch (error) {
        console.log("Error="+error);
    }
})();
