var dbName = ''; // your databse name
var mongoose = require('mongoose').connect('mongodb://localhost/' + dbName); // mongodb and running under localhost is required
var session = require('express-session');

function model(name, schema)
{
    var plural = name;
    var proper = name.charAt(0).toUpperCase() + name.slice(1, -1);
    return mongoose.model(proper, new mongoose.Schema(schema), plural);
}

module.exports = {
  express: require('express'),
  mongoose: mongoose,
  async: require('async'),
  bodyParser: require('body-parser'),
  multer: require('multer'),
  session: session,
  nodemailer: require('nodemailer'),
  mongoStore: require('connect-mongo')(session),
  helpers:
  {
    toObjectId:
      function(id){return mongoose.Types.ObjectId(id);}
  },
  // this requires the collections users, items and authentications to exist; we will refer to them in mongoose as User, Item and Authentication, respectively
  models:
  {
    User:
      // note, all users are required to abide by this schema, expect for admin(s)
      model('users',
      {
        email: {type: String, required: true, unique: true},
        username: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        verified: {type: Boolean, required: true}
      }),
    Item:
      // all items are required to abide by this schema, no exceptions
      model('items',
        {
          name: {type: String, required: true},
          price: {type: Number, required: true},
          description: {type: String, required: false},
          related: [mongoose.Schema.ObjectId],
          pictures: [String]
        }),
    Authentication:
      // all authentications are required to abide by this schema, no exceptions
      model('authentications',
        {
          refer: {type: mongoose.Schema.ObjectId, required: true},
          key: {type: String, required: true},
          expires: {type: Date, default: function(){var now = new Date();now.setHours(now.getHours() + 6);return now;}()}
        })
  }
};
