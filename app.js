const express = require('express');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const compression = require('compression');
const hpp = require('hpp');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// requiring routes
const sportRoute = require('./routes/sports');
const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const globalErrorHandler = require('./middlewares/errorHandler');
const NotFoundError = require('./errors/notFound');

// start express app
const app = express();

// global middlewares

// implement CORS
app.use(cors());

// Access-Control-Allow-Origin
app.options('*', cors());

// set security HTTP headers
app.use(helmet());

// development logging
if (app.get('env') === 'development') {
  app.use(morgan('dev'));
}

// limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000,
  mesage: 'Too many requests from this IP, Please try again in 30 minutes!',
});

app.use('/api', limiter);

// body Parser, reading data from body into req.body
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// cookie parser middleware
app.use(cookieParser());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());

// data sanitization against XSS
app.use(xss());

// prevent parameter pollution
app.use(hpp());

// compression middleware
app.use(compression());

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// routes middleware
app.use('/api/v1/sports', sportRoute);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/auth', authRoute);

app.all('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server`));
});

app.use(globalErrorHandler);

module.exports = app;
