/* eslint-disable */
require('colors');
const dotenv = require('dotenv');
const fs = require('fs');

// models
const Sport = require('../../models/Sport');
const User = require('../../models/User');
const Comment = require('../../models/Comment');

dotenv.config({ path: './variables.env' });
const connectDB = require('../../config/db');

// database connection
connectDB();

// read JSON file
const sports = JSON.parse(fs.readFileSync(`${__dirname}/sports.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const comments = JSON.parse(
  fs.readFileSync(`${__dirname}/comments.json`, 'utf-8')
);

// import data int DB
const loadData = async () => {
  try {
    await Sport.create(sports);
    await User.create(users, { validateBeforeSave: false });
    await Comment.create(comments);
    console.log(
      '👍👍👍👍👍👍👍👍 Data successfully loaded! 👍👍👍👍👍👍👍👍'.green.bold
    );
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

// remove all data from DB
const removeData = async () => {
  try {
    console.log('😢😢 Goodbye Data...');
    await Sport.deleteMany();
    await User.deleteMany();
    await Comment.deleteMany();
    console.log(
      'Data successfully deleted! To load sample data, run\n\n\t npm run sample\n\n'
        .blue.bold
    );
    process.exit();
  } catch (err) {
    console.log(
      '\n👎👎👎👎👎👎👎👎 Error! The Error info is below but if you are importing sample data make sure to drop the existing database first with.\n\n\t npm run blowitallaway\n\n\n'
        .red.bold
    );
    console.log(err);
    process.exit();
  }
};

if (process.argv.includes('--remove')) {
  removeData();
} else {
  loadData();
}
