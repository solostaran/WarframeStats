const tv4 = require("tv4-node").tv4;

var jsonData = [
    {
        "_id": "5c796514dcfbfe51dcc71e19",
        "name": "primary"
    }];
var schema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type":"array",
    "items": {
        "type" : "object",
        "properties": {
            "_id": {
                "type": "string"
            },
            "name": {
                "type": "string"
            }
        },
        "required": ["_id", "name"]
    }
};
var valid = tv4.validate(jsonData, schema);
console.log(valid);