const express = require("express");
const mysql = require("mysql");
const cors = require("cors")
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser')
var WebSocket = require('ws')
var http = require('http').createServer(app)
var io = require('socket.io')(http);
io.listen(http)
const wss = new WebSocket.Server({ noServer: true });

io.on('upgrade', function (request, socket, head) {
  wss.handleUpgrade(request, socket, head, function (ws) {
     wss.emit('connection', ws, request);
  })
})

app.use(cors({credentials: true, origin: "https://localhost:8080"}));
app.options('*', cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


dotenv.config({ path: './.env'}); //allows us to hide sensitive database names and details

const db = mysql.createConnection({
	host     : process.env.DATABASE_HOST,
	user     : process.env.DATABASE_USER,
	password : process.env.DATABASE_PASSWORD,
	database : process.env.DATABASE
});

const publicDirectory = path.join(__dirname, './public');
app.use(express.static(publicDirectory));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: false }));
// Parse JSON bodies (as sent by API forms)
app.use(express.json());
app.use(cookieParser());

app.set('view engine', 'hbs');

db.connect ( (error) => {
	if(error) {
		console.log(error)
	} else {
		console.log("MYSQL Connected...")
	}
})

//Define Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

app.get('/getName', cors(), (req, res) => {
	db.query("SELECT name FROM users WHERE loggedin=true", (err, rows, fields) => {
	  if (!err)
	  res.send(rows);
	  else
	  console.log(err);
	})
  })
  
  app.get('/getEmail', cors(), (req, res) => {
	db.query("SELECT email FROM users WHERE loggedin=true", (err, rows, fields) => {
	  if (!err)
	  res.send(rows);
	  else
	  console.log(err);
	})
  })

  app.get('/getAttributes', cors(), (req, res) => {
	db.query("SELECT userid FROM users WHERE loggedin=true", (err, row, field) => {
		if (!err)
		console.log(row)
		id = row[0].userid
		db.query(`SELECT u.userid, a.technology, a.class FROM users u inner join attributes a on u.userid = a.userid WHERE u.userid = ${id};`, (error, rows, fields) => {
			if (!error){
				res.send(rows)
			}
			else
				console.log(error)
		});
		if(err)
			console.log(err)
	})
  })

  
  app.post('/deleteTechnology', cors(), (req, res) => {
	var data = JSON.parse(JSON.stringify(req.body.value))
	console.log(data)
	for(tech in data){
		db.query("SELECT userid FROM users WHERE loggedin=true", (err, row, field) => {
			
			if (!err)
			console.log(row)
			id = row[0].userid
			query = `DELETE FROM attributes a WHERE a.userid = ${id} AND technology = "${data[tech]}";`;
			db.query(query, (error, rows, fields) => {
				if (!error){
					res.send(rows)
				}
				else
					console.log(error)
			});
			if(err)
				console.log(err)
		})
	}
  })

  app.post('/deleteClass', cors(), (req, res) => {
	var data = JSON.parse(JSON.stringify(req.body.value))
	for(tclass in data){
		db.query("SELECT userid FROM users WHERE loggedin=true", (err, row, field) => {
			
			if (!err)
			console.log(row)
			id = row[0].userid
			query = `DELETE FROM attributes a WHERE a.userid = ${id} AND class = "${data[tclass]}";`;
			console.log(query)
			db.query(query, (error, rows, fields) => {
				if (!error){
					res.send(rows)
				}
				else
					console.log(error)
			});
			if(err)
				console.log(err)
		})
	}
  })

  app.get('/getClass', cors(), (req, res) => {
	db.query("SELECT * FROM class;", (err, rows, field) => {
		  if (!err)
		  res.send(rows);
		  else
		  console.log(err);
	})
  })

  app.post('/addClass', cors(), (req, res) => {
	var data = JSON.parse(JSON.stringify(req.body.value))
	console.log(data)

	db.query("SELECT userid FROM users WHERE loggedin=true", (err, row, field) => {
		
		if (!err)
		console.log(row)
		id = row[0].userid

		query = `INSERT INTO attributes (userID, class) VALUES (${id}, '${data}');`;
		console.log(query)
		db.query(query, (error, rows, fields) => {
			if (!error){
				res.send(rows)
			}
			else
				console.log(error)
		});
		if(err)
			console.log(err)
	})
	
  })

  app.post('/addTech', cors(), (req, res) => {
	
	data = req.body.value
	console.log(req.body.value)

	db.query("SELECT userid FROM users WHERE loggedin=true", (err, row, field) => {
		
		if (!err)
			console.log(row)
			id = row[0].userid
			query = `INSERT INTO attributes (userID, technology) VALUES (${id}, '${data}')`;
			console.log(query)
			db.query(query, (error, rows, fields) => {
				if (!error){
					res.send(rows)
				}
				else
					console.log(error)
			});
		if(err)
			console.log(err)
	})
	
  })

  app.get('/getUserName', cors(), (req, res) => {
	db.query("SELECT name FROM users WHERE loggedin=true", (err, row, field) => {
		if(!err){
			console.log(row[0].name)
			res.send(row)
		}
		else{
			console.log(err)
		}

	})
  })


	io.on('connection', function(socket) {
		socket.on('username', function(username) {
			socket.username = username;
			io.emit('is_online', '🔵 <i>' + socket.username + ' join the chat..</i>');
		});

		socket.on('disconnect', function(username) {
			io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
		})

		socket.on('chat_message', function(message) {
			io.emit('chat_message', '<strong>' + socket.username + '</strong>: ' + message);
		});

	});
  

http.listen(8080)
// app.listen(8080, () => {
// 	console.log("Server started on port 8080");
// })