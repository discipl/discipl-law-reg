var xlsxtojson = require("xlsx-to-json");
var fs = require('fs');

const excelToJson = async (arr) => {
    let readyPromise = new Promise((resolve, reject) => {
        let newArr = [];
        for (let i = 0; i < arr.length; i++) {
            const element = arr[i];
            xlsxtojson({
                input: "./excels/" + element + ".xlsx",
                output: "output.json",
                lowerCaseHeaders: true
            }, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    if (i === arr.length - 1) {
                        newArr[i] = result;
                        const jsonContent = JSON.stringify(newArr);
                        fs.writeFile("output.json", jsonContent, 'utf8', function (err) {
                            if (err) {
                                return console.log(err);
                            }
                            console.log("The file was saved!");
                        });
                        resolve(newArr);
                    } else {
                        newArr[i] = result;
                    }
                }
            });
        }
    })
    return readyPromise
}

const getArr = async (arr) => {
    return excelToJson(arr);
}

module.exports = {
    excelToJson,
    getArr
}
