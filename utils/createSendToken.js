/* eslint-disable */
const createSendToken = (user, statusCode, req, res) => {
  const token = user.generateAuthToken();

  res.cookie('accessToken', token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_JWT_EXPIRES * 60 * 60 * 1000
    ),
    httpOnly: true,
    signed: true,
    sameSite: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  });

  const { password, ...rest } = user._doc;

  res.status(statusCode).json({
    status: 'success',
    token,
    ...rest,
  });
};

module.exports = createSendToken;
