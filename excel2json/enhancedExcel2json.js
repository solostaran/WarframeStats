var helper = require('./enhancedHelper.js');
var fs = require('fs');
var _ = require('lodash/core');
const objectConstructor = {}.constructor;
const default_options = {
    convert_all_sheet: true, // If this value is false, Then one sheet will processed which name would be provided
    return_type: 'Object', // Two type of return type 'File' or 'Object'
    sheetName: 'Feuil1', // Only if convert_all_sheet=false
    check_array : false,
    separator: ';' // Only if check_array=true
}

function enhancedExcel2json(options, callback) {
    // if (typeof options.sheetName != 'string') {
    //     return callback(new Error("Sheetname can only be of data type String"))
    // }
    // console.log(options);
    // helper.convert(options, function(err, output) {
    //     if (err) {
    //         return callback(err);
    //     }
    //     if (!output) {
    //         return callback(new Error("Return by helper function convert is undefined or NUll"));
    //     }
    //     if (typeof output != 'object') {
    //         return callback(new Error("Incorrect return by helper function"));
    //     }
    //     return callback(null, output[options.sheetName])
    // });
    if (typeof callback === 'undefined' && typeof options === 'function') {
        callback = options;
        options = default_options;
    }
    if (!options.input_filename) {
        //return callback(new Error("FileName undefined or null"));
        return callback(new Error("Missing filename."),{
            error:"Missing filename.",
            body_object_fields:{
                input_filename:"String: Mandatory and must contain the path to an Excel file",
                return_type: "String: two type of return type 'File' or 'Object'",
                convert_all_sheet:"Boolean: if false then one sheet will processed which name would be provided",
                sheetName: "String: processed only if convert_all_sheet=false",
                check_array: "Boolean: If true then if a header ends with [] then the corresponding values are in an array",
                separator: "String: If check_array=true then this separator will be used to split value. Default to ';'"
            }
        });
    }
    // Fusion of parameters options and default options.
    options = _.defaults(options, default_options)
    if (options.return_type == "File") {
        if (options.convert_all_sheet) {
            helper.convert(options, function(err, output) {
                if (err) {
                    return callback(err);
                }
                if (!output) {
                    return callback(new Error("Return by helper function convert is undefined or NUll"));
                }
                if (typeof output != 'object') {
                    return callback(new Error("Incorrect return by helper function"));
                }
                var FileSavedOutput = [];
                async.eachSeries(Object.keys(output), function(sheetname, cb) {
                    var excelOutPutFile = 'xlsx_2Json_SheetName_' + sheetname + '.json';
                    fs.writeFile(excelOutPutFile, JSON.stringify(output[sheetname]), function(err) {
                        if (err) {
                            return cb(err);
                        } else {
                            //console.log("JSON saved to " + excelOutPutFile);
                            FileSavedOutput.push({
                                OutputFileName: excelOutPutFile
                            })
                            return cb();
                        }
                    });
                }, function(err) {
                    if (err) {
                        return callback(err);
                    }
                    return callback(null, FileSavedOutput);
                });

            });
        } else {
            if (typeof options.sheetName != 'string') {
                return callback(new Error("Sheetname can only be of data type String"))
            }
            helper.convert(options, function(err, output) {
                if (err) {
                    return callback(err);
                }
                if (!output) {
                    return callback(new Error("Return by helper function convert is undefined or NUll"));
                }
                if (typeof output != 'object') {
                    return callback(new Error("Incorrect return by helper function"));
                }
                var FileSavedOutput = [];
                var excelOutPutFile = 'xlsx_2Json_SheetName_' + options.sheetName + '.json';
                fs.writeFile(excelOutPutFile, JSON.stringify(output[options.sheetName]), function(err) {
                    if (err) {
                        FileSavedOutput.push({
                            OutputFileName: excelOutPutFile,
                            saved: false,
                            error: err
                        });
                    } else {
                        FileSavedOutput.push({
                            OutputFileName: excelOutPutFile,
                            saved: true
                        });
                    }
                    return callback(null, FileSavedOutput)
                });
            });
        }
    } else if (options.return_type == "Object") {
        if (options.convert_all_sheet) {
            helper.convert(options, function(err, output) {
                if (err) {
                    return callback(err);
                }
                if (!output) {
                    return callback(new Error("Return by helper function convert is undefined or NUll"));
                }
                if (typeof output != 'object') {
                    return callback(new Error("Incorrect return by helper function"));
                }
                return callback(null, output);
            });
        } else {
            if (typeof options.sheetName != 'string') {
                return callback(new Error("Sheetname can only be of data type String"))
            }
            helper.convert(options, function(err, output) {
                if (err) {
                    return callback(err);
                }
                if (!output) {
                    return callback(new Error("Return by helper function convert is undefined or NUll"));
                }
                if (typeof output != 'object') {
                    return callback(new Error("Incorrect return by helper function"));
                }
                return callback(null, output[options.sheetName])
            });
        }
    }
}

module.exports = enhancedExcel2json;