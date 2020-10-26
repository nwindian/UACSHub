const express = require("express");
const mysql = require("mysql");
const app = express();
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

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

app.listen(8080, () => {
	console.log("Server started on port 8080");
})