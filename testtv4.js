const tv4 = require("tv4");

const jsonData = [
    {
        "_id": "5c796514dcfbfe51dcc71e19",
        "name": "primary"
    }];
const schema = {
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
let valid = tv4.validate(jsonData, schema);
console.log(valid);
