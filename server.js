var services = require('./services');
var Schema = services.mongoose.Schema;
var app = services.express();
var models = services.models;

var secret = ""; // your secret here

// the function is called just for debugging purposes to check if the mail is sent properly
// and that the mail is delivered
(function(){
	var config = {}; // your config here for the nodemailer transporter
	var options = {}; // your configurations for sent mail including the fields: from, to, subject, html
	var transporter = services.nodemailer.createTransport(config);
	transporter.sendMail(options, function(err, inf){
		if(err)
			console.log(err);
		else
			console.log('Sent: ' + inf.response);
	});
})();

app.use(services.bodyParser.urlencoded({extended: true}));
app.use(services.bodyParser.json());
app.use(services.session({secret: secret, resave: false, saveUninitialized: false, resave: false,
	store: new services.mongoStore({mongooseConnection: services.mongoose.connection, ttl: 2*24*60*60, touchAfter: 24*3600})}));
app.use('/resources', services.express.static(__dirname + '/public/resources'));

app.set('views', './public/views');
app.set('view engine', 'ejs');

app.get('/', function(req, res){
	res.render('index');
});
app.get('/error', function(req, res){
	res.send('<span>Error 404: Page not found</span>');
});
app.get('/item/:id', function(req, res){
	res.render('item');
});
app.get('/api/item/:id', function(req, res){
	var oid = req.params.id;
	try{
		  models.Item.find({_id: services.helpers.toObjectId(oid)}, function(err, docs){
				if(err)
					res.json({error: "Item does not exist."});
				else{
					var doc = docs[0].toObject();
					doc.created_at = services.helpers.toObjectId(doc._id).getTimestamp();
					var elements = [];
					services.async.each(doc.related, function(id, done){
						models.Item.find({_id: services.helpers.toObjectId(id)}, function(err, d){
							var elem = {};
							elem[id] = d[0].name;
							elements.push(elem);
							done();
						});
					}, function(err){doc.related = elements; res.json(doc)});
				}
			});
	}
	catch(err){
		res.json({error: 'Item does not exist'});
	}
});
app.get('/items/recent', function(req, res){
	var documents;
	models.Item.find({}).sort({_id:-1}).limit(5).lean().exec(function(err, docs){
		documents = docs;
		services.async.each(documents, function(doc, sync){
			doc.created_at = services.helpers.toObjectId(doc._id).getTimestamp();
			sync();
		}, function(err){res.json(documents);});
	});
});
app.get('/login', function(req, res){
	res.render('login');
});
app.get('/home', function(req, res){
	res.render('home');
});
app.post('/login', function(req, res){
	var user = {username: req.body.username, password: req.body.password};
	// users: email, username, password
	if((!user.username) || (!user.password)){
		res.json({error: 'No username and/or password provided'});
		return;
	}
	models.User.find(user).lean().exec(function(err, users){
		if((!users) || users.length < 1){
			if(user.username !== 'admin')
      	res.json({error: user.username + " does not exist!"});
			// if they don't provide the correct password for the user admin, we lie and say that admin is out of reach
			// this is for users
			else
				res.json({error: "Impossible to log in as admin!"});
		}
		else if(!err && users && users.length > 0){
			if(user.username === 'admin' || users[0].verified){
				req.session.user = users[0];
				req.session.logged_in = true;
				res.json({username: user.username});
			} else{
				res.json({error: user.username + "'s account has not been verified yet! Please check your email!"});
			}
		} else {
			res.json({error: "There was an error processing your request. Please try again."});
		}
	});
}); // not yet implemented
app.get('/signup', function(req, res){

});
app.get('/logged_in', function(req, res){
	if(req.session && req.session.logged_in && req.session.user){
		res.json({logged: true, username: req.session.user.username});
	} else{
		res.json({logged: false});
	}
});
app.post('/signup', function(req, res){
	//var transporter = nodemailer.createTransport(email);
	//var mailReq = {from: email.auth.user, to: req.body.email, subject: 'Account creation for demo-app@gerardvee.com'};

});
app.post('/logout', function(req, res){
	req.session.destroy();
});
app.listen(8080);
