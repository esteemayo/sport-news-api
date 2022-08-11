const _ = require('lodash');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const User = require('../models/User');
const Sport = require('../models/Sport');
const BadRequestError = require('../errors/badRequest');
const factory = require('./handlerFactory');
const createSendToken = require('../utils/createSendToken');

exports.register = asyncHandler(async (req, res, next) => {
  const newUser = _.pick(req.body, [
    'name',
    'username',
    'email',
    'password',
    'passwordConfirm',
    'role',
    'passwordChangedAt',
  ]);

  const user = await User.create({ ...newUser });

  if (user) {
    createSendToken(user, StatusCodes.CREATED, req, res);
  }
});

exports.getUserStats = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const lastYear = new Date(now.setFullYear(now.getFullYear() - 1));

  const stats = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: lastYear },
      },
    },
    {
      $project: {
        month: { $month: '$createdAt' },
      },
    },
    {
      $group: {
        _id: '$month',
        total: { $sum: 1 },
      },
    },
  ]);

  res.status(StatusCodes.OK).json({
    status: 'success',
    stats,
  });
});

exports.updateMe = asyncHandler(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (password || passwordConfirm) {
    return next(
      new BadRequestError(
        `This route is not for password updates. Please use update ${
          req.protocol
        }://${req.get('host')}/api/v1/auth/update-my-password`
      )
    );
  }

  const filterBody = _.pick(req.body, 'name', 'username', 'email');

  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    { $set: { ...filterBody } },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.deleteMe = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  await Sport.deleteMany({ user: user.id });

  res.status(StatusCodes.NO_CONTENT).json({
    status: 'success',
    user: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.createUser = (req, res) => {
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'fail',
    message: `This route is not defined! Please use ${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/register`,
  });
};

exports.getUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
