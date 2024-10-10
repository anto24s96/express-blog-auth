const fs = require("fs");
const path = require("path");

//funzione per scrittura nel json
const writeJSON = (fileName, newData) => {
    const filePath = path.join(__dirname, "db", `${fileName}.json`);
    const fileString = JSON.stringify(newData);
    fs.writeFileSync(filePath, fileString);
};

module.exports = {
    writeJSON,
};
