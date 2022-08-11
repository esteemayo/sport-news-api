const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const Comment = require('../models/Comment');
const NotFoundError = require('../errors/notFound');
const factory = require('./handlerFactory');
const ForbiddenError = require('../errors/forbidden');

exports.updateComment = asyncHandler(async (req, res, next) => {
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(`No comment found with that ID →→ ${commentId}`)
    );
  }

  if (comment.user.id === String(req.user.id) || req.user.role === 'admin') {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      comment: updatedComment,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This comment does not belong to you')
  );
});

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const { id: commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(
      new NotFoundError(`No comment found with that ID →→ ${commentId}`)
    );
  }

  if (comment.user.id === String(req.user.id) || req.user.role === 'admin') {
    await comment.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      comment: null,
    });
  }
});

exports.sendSportUserIds = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.sport) req.body.sport = req.params.id;

  next();
};

exports.getComments = factory.getAll(Comment);
exports.getComment = factory.getOne(Comment);
exports.createComment = factory.createOne(Comment);
