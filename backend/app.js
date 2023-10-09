const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const csurf = require('csurf');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');




const { environment } = require('./config');
const isProduction = environment === 'production';

const app = express();

// const spotsRouter = require('./routes/api/spots');
// const reviewsRouter = require('./routes/api/reviews');


app.use(morgan('dev'));

app.use(cookieParser());
app.use(express.json());


// Security Middleware
if (!isProduction) {
    // enable cors only in development
    app.use(cors());
  }

  // helmet helps set a variety of headers to better secure your app
  app.use(
    helmet.crossOriginResourcePolicy({
      policy: "cross-origin"
    })
  );

  // Set the _csrf token and create req.csrfToken method
  app.use(
    csurf({
      cookie: {
        secure: isProduction,
        sameSite: isProduction && "Lax",
      }
    })
  );

  const routes = require('./routes');

  app.use(routes); // Connect all the routes
  // app.use('/api/spots', spotsRouter);
  // app.use('/api/reviews',reviewsRouter);


  app.use((_req, _res, next) => {
    const err = new Error("The requested resource couldn't be found.");
    // err.title = "Resource Not Found";
    // err.errors = { message: "The requested resource couldn't be found." };
    err.status = 404;
    next(err);
  });

  const { ValidationError } = require('sequelize');



// Process sequelize errors
app.use((err, _req, _res, next) => {
  // check if error is a Sequelize error:
  if (err instanceof ValidationError) {
    let errors = {};
    for (let error of err.errors) {
      errors[error.path] = error.message;
    }
    err.title = 'Validation error';
    err.errors = errors;

  }
  next(err);
});

// Error formatter
app.use((err, _req, res, _next) => {
  res.status(err.status || 500);

  res.json({
    // title: err.title || 'Server Error',
    message: err.message,
    // errors: err.errors,
    // stack: isProduction ? null : err.stackhttps://file+.vscode-resource.vscode-cdn.net/Users/ranwang/Desktop/app/w12/july_2023/student_practices/W12/aiabnb/images/airbnb_dbdiagram.png?version%3D1696725182702
  });
});


  module.exports = app;
