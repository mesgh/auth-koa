const { Schema, model } = require('../connections/newusers');
const userSchema = new Schema({
  "login": {
    "type": "String",
  },
  "password": {
    "type": "String",
  },
},
);	
const User = model('User', userSchema);
module.exports = { User };
