var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require(`cors`)
require(`dotenv`).config()
var app = express();

// import routes
const loginRoute = require(`./routes/login`)
const uploadRoute = require(`./routes/videos/upload`)
const videoRoute = require (`./routes/videos/videos`)
const transcodeRoute = require(`./routes/videos/transcode`)


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// Setup routes
app.use(`/login`, loginRoute)
app.use(`/videos`, uploadRoute)
app.use(`/videos`, videoRoute)
app.use(`/videos`, transcodeRoute)


app.get('/', (req, res) => {
  res.status(200).json({hi:'hello from main'})
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT
const server = app.listen(port)

module.exports = app;
