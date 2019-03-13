var async = require('async');
var XLSX = require('xlsx');
var path = require('path');

var options = {
    check_array : false,
    separator: ';' // Only if check_array=true
}

module.exports = {
    read: function(fileName) {
        var dir = __dirname;
        //var filePath = path.resolve(dir, '../test/Persona_Sheet_New.xlsx');
        try {
            var filePath = path.resolve(dir, fileName); // fileName object with relative path of file
            return XLSX.readFile(filePath);
        } catch (e) {
            return e;
        }
    },
    convert: function(options, callback) {
        var workbook = this.read(options.input_filename);
        if(!workbook){
            return callback(new Error("WorkBook object is Undefined or NUll"));
        }
        if(workbook instanceof Error) {
            return callback(new Error("Getting a error while reading the file"));
        }
        var sheet_name_list = workbook.SheetNames;
        var output = {};
        sheet_name_list.forEach(function(y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var arrays = {};
            var data = [];
            for (z in worksheet) {
                if (z[0] === '!') continue;
                //parse out the column, row, and value
                var col = z.substring(0, 1);
                var row = parseInt(z.substring(1));
                var value = worksheet[z].v;

                //store header names
                if (row == 1) {

                    if (options.check_array) {
                        var bool = value.endsWith('[]');
                        arrays[col] = bool;
                        if (bool)
                            headers[col] = value.substring(0, value.length - 2);
                        else
                            headers[col] = value;
                    }
                    else
                        headers[col] = value;
                    continue;
                }

                if (!data[row]) data[row] = {};
                data[row][headers[col]] = value;
                if (options.check_array && arrays[col]) {
                    data[row][headers[col]] = value.split(options.separator);
                }

            }
            //drop those first two rows which are empty
            data.shift();
            data.shift();
            output[y] = data;
        });
        return callback(null, output);
    }
};