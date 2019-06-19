"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var async = require('async');

// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');

var express = require('express');
var app = express();

var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');

var fs = require("fs");
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');

mongoose.connect('mongodb://localhost/cs142project6', { useMongoClient: true });

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));

app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());


app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});

/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }

            // We got the object - return it in JSON format.
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});

/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
  // if(request.session === undefined){
  //   response.status(401).send("no session")
  // }
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.find({}).select("first_name last_name _id").exec(function(err, info){
    if (err) {
        // Query returned an error.  We pass it back to the browser with an Internal Service
        // Error (500) error code.
        console.error('Doing /user/info error:', err);
        response.status(500).send(JSON.stringify(err));
        return;
    }
    if (info.length === 0) {
        // Query didn't return an error but didn't find the SchemaInfo object - This
        // is also an internal error return.
        response.status(500).send('Missing UserInfo');
        return;
    }

    // We got the object - return it in JSON format.
    response.status(200).send(JSON.stringify(info));
  });
    //response.status(200).send(cs142models.userListModel());
});

/*
 * URL /user/:id - Return the information for User (id)
 */
app.get('/user/:id', function (request, response) {
    if(request.session.login_name === undefined){
      response.status(401).send("not logged in");
      return;
    }
    var id = request.params.id;
    User.findOne({_id: id}).select("_id first_name last_name location occupation description user_favorites").exec(function(err, info){
      if (err) {
          // Query returned an error.  We pass it back to the browser with an Internal Service
          // Error (500) error code.
          console.error('Doing /user/info error:', err);
          response.status(400).send("error");
          return;
      }
      if (info === null) {
          // Query didn't return an error but didn't find the SchemaInfo object - This
          // is also an internal error return.
          console.log('User with _id:' + id + ' not found.');
          response.status(400).send('Not found');
          return;
      }
      // We got the object - return it in JSON format.
      response.status(200).send(info);
    });
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
    if(request.session.login_name === undefined){
      response.status(401).send("not logged in");
      return;
    }
    var id = request.params.id;
    Photo.find({user_id: id}).exec(function(err, info2){
      var info = JSON.parse(JSON.stringify(info2));
      if (err) {
          // Query returned an error.  We pass it back to the browser with an Internal Service
          // Error (500) error code.
          console.error('Doing /photosOfUser error:', err);
          response.status(400).send("error");
          return;
      }
      if (info === null) {
          // Query didn't return an error but didn't find the SchemaInfo object - This
          // is also an internal error return.
          console.log('User with _id:' + id + ' not found.');
          response.status(400).send('Not found');
          return;
      }

      var allowedPhotos = []
        for(let i=0; i < info.length; i++){
          console.log("allowed users is ", info[i].allowed_users)
          if(info[i].user_id === request.session._id){
            allowedPhotos.push(info[i])
          } else{
            if(info[i].allowed_users[0] !== undefined){
              if(info[i].allowed_users.length == 1 && info[i].allowed_users[0] === ''){
                allowedPhotos.push( info[i] )
              }else{
                if(info[i].allowed_users.includes(request.session.login_name)){
                  allowedPhotos.push(info[i])
                  console.log("allowed")
                } else {
                  console.log("unallowed!")
                }
              }
            } else {
              console.log(info[i].allowed_users)
              console.log("no specification")
              allowedPhotos.push( info[i] )
            }
          }
        }

      info = allowedPhotos
      console.log("INFAKDF O is ", info)

      // We got the object - return it in JSON format.
      async.each(info, function(photo, iteratorCallback){
        async.each(photo.comments, function(comment, commentCallback){
          User.find({_id: comment.user_id}).select("first_name last_name user_id").exec(function(err, comment_info){
            console.log("comment is ", comment_info)
            comment.user = comment_info[0]._doc
            delete comment["user_id"]
            commentCallback()
          })
        }, function(err){
          if(err){
            console.log("error occurred");
            response.status(400).send("JSON.stringify(err)");
          } else{
            iteratorCallback();
          }
        });
      }, function(err){
        if(err){
          console.log("error occurred");
          response.status(400).send("JSON.stringify(err)");
        } else{
          console.log("all photos processed");
          response.status(200).send(info);
        }
      });
      return;
    });
});

app.get('/photosOfCurrUser/:id', function (request, response) {
    if(request.session.login_name === undefined){
      response.status(401).send("not logged in");
      return;
    }
    var id = request.params.id;
    Photo.find({user_id: id}).select("_id user_id comments file_name date_time").exec(function(err, info2){
      var info = JSON.parse(JSON.stringify(info2));
      if (err) {
          // Query returned an error.  We pass it back to the browser with an Internal Service
          // Error (500) error code.
          console.error('Doing /photosOfUser error:', err);
          response.status(400).send("error");
          return;
      }
      if (info === null) {
          // Query didn't return an error but didn't find the SchemaInfo object - This
          // is also an internal error return.
          console.log('User with _id:' + id + ' not found.');
          response.status(400).send('Not found');
          return;
      }
      var current_photo = info[0];
      for(let i=1; i< info.length; i++){
        if(info[i].date_time > current_photo.date_time){
          current_photo = info[i]
        }
      }
      response.status(200).send(current_photo)
    });
});

app.get('/topCommentPhoto/:id', function (request, response) {
    if(request.session.login_name === undefined){
      response.status(401).send("not logged in");
      return;
    }
    var id = request.params.id;
    Photo.find({user_id: id}).select("_id user_id comments file_name date_time").exec(function(err, info2){
      var info = JSON.parse(JSON.stringify(info2));
      if (err) {
          // Query returned an error.  We pass it back to the browser with an Internal Service
          // Error (500) error code.
          console.error('Doing /photosOfUser error:', err);
          response.status(400).send("error");
          return;
      }
      if (info === null) {
          // Query didn't return an error but didn't find the SchemaInfo object - This
          // is also an internal error return.
          console.log('User with _id:' + id + ' not found.');
          response.status(400).send('Not found');
          return;
      }
      var current_photo = info[0];
      for(let i=1; i< info.length; i++){
        if(info[i].comments.length > current_photo.comments.length){
          console.log("updated!")
          current_photo = info[i]
        }
      }
      response.status(200).send(current_photo)
    });
});


app.post('/admin/login', function(request, response){
  User.findOne({login_name: request.body.login_name, password: request.body.password}, function(err, usr){
    if(err){
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if(usr === null){
      response.status(400).send("no name found");
      return;
    }
    request.session.login_name = usr.login_name;
    request.session._id = usr._id
    response.status(200).send(usr);
    return;
  })
});

app.post('/user', function(request, response){
  User.findOne({login_name: request.body.login_name}, "login_name", function(err, usr){
    if(err){
      response.status(400).send(JSON.stringify(err));
      return;
    }
    var info = request.body;
    if(usr !== null){
      response.status(400).send('login name taken');
      return;
    }
    var new_user = {login_name: info.login_name, password: info.password, first_name: info.first_name, last_name: info.last_name, location: info.location, description: info.description, occupation: info.occupation, user_favorites: []}
    User.create(new_user, function(err){
      if(err){
        response.status(400).send('error!');
        return;
      }
    });
    response.status(200).send("successfully sent!")
  })
});

app.post('/admin/logout', function(request, response){
  if(request.session !== undefined){
    response.status(200).send();
    request.session.destroy(function(){});
  } else{
    response.status(401).send("not logged in!");
  }
  return;
});

app.post('/updateLastActivity', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.findOne({_id: request.session._id}).exec(function(err, info){
    if(info.last_activity === undefined){
      info.last_activity = {[request.session._id]: request.body.last_activity}
    }else{
      info.last_activity.user = request.body.last_activity
    }
    info.save();
    console.log("INFO after", info)
    response.status(200).send(info);
  })
});

app.get('/getLastActivity', function(request, response){
  User.findOne({_id: request.session._id}).exec(function(err, info){
    console.log("LAST ", info)
    response.status(200).send(info.last_activity);
  })
});

app.post('/commentsOfPhoto/:photo_id', function(request, response){
  let id = request.params.photo_id;
  Photo.findOne({_id: id}).exec(function(err, info){
    let usr_comment = request.body.comment
    if(usr_comment === null || usr_comment == undefined){
      response.status(400).send("empty comment");
      return;
    }
    if (!info){
      response.status(400).send("no photos");
      return;
    }
    info.comments = info.comments.concat([{comment: usr_comment, date_time: Date(), user_id: request.session._id}]);
    info.save();
    response.status(200).send(info);
  })
});

app.post('/addToFavorites/', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.findOne({_id: request.session._id}).select("_id user_id comments file_name date_time user_favorites").exec(function(err, info){
    info.user_favorites = info.user_favorites.concat([request.body.new_id]);
    info.save();
    response.status(200).send(info);
  })
});

app.post('/removeFromFavorites/', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.findOne({_id: request.session._id}).select("_id user_id comments file_name date_time user_favorites").exec(function(err, info){
    for(let i=0; i < info.user_favorites.length; i++){
      if(info.user_favorites[i] == request.body.id){
        info.user_favorites.splice(i, 1)
      }
    }
    info.save();
    response.status(200).send(info);
  })
});

app.get('/getLikes/', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  // console.log("PHOT ID ",request.body.photoid)
  Photo.findOne({_id: request.body.photoid}).exec(function(err, info){
    if(info.num_likes === undefined || info.num_likes === null){
      response.status(200).send(0);
      return;
    }
    response.status(200).send(info.num_likes);
  })
});

app.post('/likePhotoUser/', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.findOne({_id: request.body.userid}).exec(function(err, usr){
    Photo.findOne({_id: request.body.photoid}).exec(function(err, photo){
      console.log("num likes ", photo)
      if(photo.num_likes === undefined){
        photo.num_likes = 1;
      } else{
        photo.num_likes++;
      }
      console.log("num likes2 ", photo)
      usr.liked = usr.liked.concat([photo._id])
      usr.save()
      photo.save()
      response.status(200).send([usr.liked, photo.num_likes]);
    })
  })
});

app.post('/unlikePhotoUser/', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }

  User.findOne({_id: request.body.userid}).exec(function(err, usr){
    for(let i=0; i < usr.liked.length; i++){
      if(usr.liked[i] == request.body.photoid){
        usr.liked.splice(i, 1)
      }
    }
    Photo.findOne({_id: request.body.photoid}).exec(function(err, photo){
      console.log("user liked is BEFORE", photo)
      photo.num_likes--;
      photo.save()
      console.log("user liked is AFTER", photo)

    })
    usr.save()
    response.status(200).send(usr.liked);
  })
});

app.get('/getLikePhotoUser/', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.findOne({_id: request.session._id}).exec(function(err, usr){
    response.status(200).send(usr.liked);
  })
});

app.get('/photosOf/favorites', function (request, response) {
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  User.findOne({_id: request.session._id}).select("_id user_id comments file_name date_time user_favorites").exec(function(err, info){
    if (err) {
        response.status(500).send(JSON.stringify(err));
        return;
    }
    var photo_list = []
    async.each(info.user_favorites, function (photoid, done_callback) {
        Photo.findOne({_id: photoid}).exec(function(err, photo){
          if(err){
            response.status(400).send(JSON.stringify(err));
            return
          }
          photo_list = photo_list.concat([photo]);
          done_callback();
        })
    }, function (err) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        } else {
            response.status(200).send(photo_list);
        }
    });
  });
});

app.post('/photos/new', function(request, response){
  if(request.session.login_name === undefined){
    response.status(401).send("not logged in");
    return;
  }
  processFormBody(request, response, function (err) {
    if (err || !request.file) {
        response.status(400).send("bad request")
        return;
    }
    // request.file has the following properties of interest
    //      fieldname      - Should be 'uploadedphoto' since that is what we sent
    //      originalname:  - The name of the file the user uploaded
    //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
    //      buffer:        - A node Buffer containing the contents of the file
    //      size:          - The size of the file in bytes

    // XXX - Do some validation here.
    // We need to create the file in the directory "images" under an unique name. We make
    // the original file name unique by adding a unique prefix with a timestamp.
    var timestamp = new Date().valueOf();
    var filename = 'U' +  String(timestamp) + request.file.originalname;

    var photo = {file_name: filename, date_time: timestamp, user_id: request.session._id, comments: []}
    fs.writeFile("./images/" + filename, request.file.buffer, function (err) {
      // XXX - Once you have the file written into your images directory under the name
      // filename you can create the Photo object in the database
      if(err){
        return;
      }
      Photo.create(photo, function(err){
        if(err){
          response.status(400).send('error!');
          return;
        }
      });
      response.status(200).send("success");
    });
});
})

app.post('/deleteAccount', function(request, response) {
  User.findOneAndRemove({_id: request.session._id}, function(err, usr) {
    if (err) {
      response.status(400).send(err);
      return;
    }
    if (usr === null) {
      response.status(400).send('Not found');
      return;
    }
    Photo.find({}, function(err, pics) {
      if (err) {
        response.status(400).send(err);
        return;
      }
      if (pics === null) {
        response.status(400).send('Not found');
        return;
      }
      async.each(pics, function(photo, photo_callback) {
        let saved = []
        let comments = photo.comments;
        async.each(comments, function(comment, comment_callback) {
          if(comment.user_id != request.session.user_id) {
            saved = saved.concat([comment]);
          }
          comment_callback();
        }, function(err) {
          if(err) {
            photo_callback(err);
          } else {
            photo.comments = saved;
            photo.save();
            photo_callback();
          }
        });
      }, function(err) {
        if(err) {
          response.status(400).send(err);
          return;
        } else {
          response.status(200).send(JSON.stringify("Successfully deleted"));
        }
      });
    });
  });
});


app.post('/deleteComment', function(request, response) {
  if(typeof(request.session.login_name) === 'undefined') {
    response.status(400).send('No user logged in');
    return;
  }

  Photo.findOne({_id: request.body.photoId}, function(err, pic) {
    if(err) {
      response.status(400).send(err);
      return;
    }
    if(pic === null) {
      response.status(400).send('Not found');
      return;
    }
    var comments = pic.comments;
    var count = null;
    comments.map(function(ct) {
      //intentionally using 2 equals instead of 3 bc they are not the same type
      if(ct._id == request.body.comment_id) {
        count = ct;
      }
    });
    if(comments.indexOf(count) !== -1) {
      comments.splice(comments.indexOf(count), 1);
    }
    pic.comments = comments;
    pic.save();
    response.status(200).send(JSON.stringify(pic));
  });
});

app.post('/deletePhoto/:photoId', function(request, response) {
  //make sure that the user is logged in
  if(typeof(request.session.login_name) === 'undefined') {
    response.status(400).send('Not logged in');
    return;
  }
  Photo.findOneAndRemove({_id: request.params.photoId}, function(err, photo) {
    if(err) {
      response.status(400).send(JSON.stringify(err));
      return;
    }
    if(photo === null) {
      response.status(400).send('Not found');
      return;
    }
    User.find({}, function(err, info){
      if(err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      if(info === null) {
        response.status(400).send('Not found');
        return;
      }

      info.map(function(pic) {
        var favorites = pic.user_favorites;
        var index = favorites.indexOf(request.body.photoid);
        if(index !== -1) {
          favorites.splice(index, 1);
          pic.favorite_photo_ids = favorites;
          pic.save();
        }
      });
    });
    response.status(200).send(JSON.stringify("photo deleted"));
  });
});

app.post('/addAllowedUsers/:id', function (request, response) {
    Photo.find( {user_id: request.params.id}, '-__v', function (err, info) {
      if (err) {
        response.status(400).send(JSON.stringify(err));
        return;
      }
      if (info === undefined) {
        response.status(400).send('missing');
        return;
      }
      if (info === null) {
        response.status(400).send('No Photos');
        return;
      }
      var recent = info[0]
      for (var i = 0; i < info.length; i++) {
        if( info[i].date_time > recent.date_time ){
          recent = info[i]
        }
      }
      recent.allowed_users = request.body.allowedUsers;
      console.log("recent allowed", recent.allowed_users)
      recent.save()
      response.status(200).send(recent);
    })
});

var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});
