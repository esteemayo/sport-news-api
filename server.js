/* eslint-disable */
const dotenv = require('dotenv');
require('colors');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 🔥 Shutting down...'.red.bold);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './variables.env' });
const app = require('./app');
const connectDB = require('./config/db');

// database connection
connectDB();

app.set('port', process.env.PORT || 9999);

const server = app.listen(app.get('port'), () =>
  console.log(`Server running on port → ${server.address().port}`)
);
