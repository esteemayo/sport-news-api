const crypto = require('crypto');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const User = require('../models/User');
const BadRequestError = require('../errors/badRequest');
const NotFoundError = require('../errors/notFound');
const CustomAPIError = require('../errors/customAPIError');
const ForbiddenError = require('../errors/forbidden');
const UnauthenticatedError = require('../errors/unauthenticated');
const createSendToken = require('../utils/createSendToken');
const sendMail = require('../utils/email');

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new BadRequestError('Please provide email and password'));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new UnauthenticatedError('Incorrect email or password'));
  }

  createSendToken(user, StatusCodes.OK, req, res);
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError('You do not have permission to perform this action')
      );
    }
    next();
  };

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new BadRequestError('Please provide your email address'));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return next(new NotFoundError('There is no user with the email address'));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/auth/reset-password/${resetToken}`;

  const message = `
  Hi ${user.name},
  There was a request to change your password!
  If you did not make this request then please ignore this email.
  Otherwise, please click this link to change your password: ${resetURL}
`;

  const html = `
  <div style='background: #f7f7f7; color: #333; padding: 50px; text-align: left;'>
    <h3>Hi ${user.name},</h3>
    <p>There was a request to change your password!</p>
    <p>If you did not make this request then please ignore this email.</p>
    <p>Otherwise, please click this link to change your password: 
      <a href='${resetURL}'>Reset my password →</a>
    </p>
  </div>
`;

  try {
    await sendMail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes)',
      message,
      html,
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: `Token sent to email →→ ${user.email}`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new CustomAPIError(
        'There was an error sending the email. Try again later'
      )
    );
  }
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new BadRequestError('Token is invalid or has expired'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, StatusCodes.OK, req, res);
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { password, passwordConfirm, passwordCurrent } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(passwordCurrent))) {
    return next(new UnauthenticatedError('Your current password is wrong'));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createSendToken(user, StatusCodes.OK, req, res);
});
