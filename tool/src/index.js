var xlsxtojson = require("xlsx-to-json");
var fs = require('fs');

class ExcelJson {
    excelToJson(arr) {
        let readyPromise = new Promise((resolve, reject) => {
            let newArr = [];
            for (let i = 0; i < arr.length; i++) {
                const element = arr[i];
                xlsxtojson({
                    input: "./excels/" + element + ".xlsx",  // input xls 
                    output: "output.json", // output json 
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

    async getArr(arr) {
        return this.excelToJson(arr);
    }
}
export default ExcelJson
