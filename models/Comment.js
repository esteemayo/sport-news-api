const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      trim: true,
      required: [true, 'Please provide a comment body'],
    },
    sport: {
      type: mongoose.Types.ObjectId,
      ref: 'Sport',
      required: [true, 'A comment must belong to a sport'],
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A comment must belong to a user'],
    },
  },
  {
    timestamps: true,
  }
);

const Comment =
  mongoose.models.Comment || mongoose.model('Comment', commentSchema);

module.exports = Comment;
