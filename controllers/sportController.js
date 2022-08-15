const slugify = require('slugify');
const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('express-async-handler');

const Sport = require('../models/Sport');
const NotFoundError = require('../errors/notFound');
const ForbiddenError = require('../errors/forbidden');
const APIFeatures = require('../utils/apiFeatures');

exports.getSports = asyncHandler(async (req, res, next) => {
  // filtering
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach((elem) => delete queryObj[elem]);

  // advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

  let query = Sport.find(JSON.parse(queryStr));

  // sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }

  // limiting fields
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // pagination
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 5;
  const skip = (page - 1) * limit;

  const total = await Sport.countDocuments();
  query = query.skip(skip).limit(limit);

  const numberOfPages = Math.ceil(total / limit);

  const sports = await query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: sports.length,
    currentPage: page,
    totalSports: total,
    numberOfPages,
    sports,
  });
});

exports.getUserSports = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Sport.find({ user: req.user.id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const sports = await features.query;

  res.status(StatusCodes.OK).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: sports.length,
    sports,
  });
});

exports.searchSport = asyncHandler(async (req, res, next) => {
  const sports = await Sport.find(
    {
      $text: {
        $search: req.query.searchQuery,
      },
    },
    {
      score: {
        $meta: 'textScore',
      },
    }
  )
    .sort({
      score: {
        $meta: 'textScore',
      },
    })
    .limit(10);

  res.status(StatusCodes.OK).json({
    status: 'success',
    results: sports.length,
    sports,
  });
});

exports.getSportById = asyncHandler(async (req, res, next) => {
  const { id: sportId } = req.params;

  const sport = await Sport.findById(sportId).populate({ path: 'comments' });

  if (!sport) {
    return next(
      new NotFoundError(`No sport news found with that ID →→ ${sportId}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    sport,
  });
});

exports.getSportBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const sport = await Sport.findOne({ slug }).populate({ path: 'comments' });

  if (!sport) {
    return next(
      new NotFoundError(`No sport news found with that SLUG →→ ${slug}`)
    );
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    sport,
  });
});

exports.createSport = asyncHandler(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;

  const sport = await Sport.create({ ...req.body });

  if (sport) {
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      sport,
    });
  }
});

exports.updateSport = asyncHandler(async (req, res, next) => {
  const { id: sportId } = req.params;

  const sport = await Sport.findById(sportId);

  if (!sport) {
    return next(
      new NotFoundError(`No sport news found with that ID →→ ${sportId}`)
    );
  }

  if (req.body.name) {
    req.body.slug = slugify(req.body.name, { lower: true });
  }

  if (sport.user.id === String(req.user.id) || req.user.role === 'admin') {
    const updatedSport = await Sport.findByIdAndUpdate(
      sportId,
      { $set: { ...req.body } },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      sport: updatedSport,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This sport news does not belong to you')
  );
});

exports.likeSport = asyncHandler(async (req, res, next) => {
  const { id: sportId } = req.params;

  let sport = await Sport.findById(sportId);

  if (!sport) {
    return next(
      new NotFoundError(`No sport news found with that ID →→ ${sportId}`)
    );
  }

  const index = sport.likes.findIndex((id) => id === String(req.user.id));

  if (index !== -1) {
    sport.likes = sport.likes.filter((id) => id !== String(req.user.id));
  } else {
    sport.likes.push(req.user.id);
  }

  sport = await Sport.findByIdAndUpdate(
    sportId,
    { $set: { ...sport } },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(StatusCodes.OK).json({
    status: 'success',
    sport,
  });
});

exports.deleteSport = asyncHandler(async (req, res, next) => {
  const { id: sportId } = req.params;

  const sport = await Sport.findById(sportId);

  if (!sport) {
    return next(
      new NotFoundError(`No sport news found with that ID →→ ${sportId}`)
    );
  }

  if (sport.user.id === String(req.user.id) || req.user.role === 'admin') {
    await sport.remove();

    return res.status(StatusCodes.NO_CONTENT).json({
      status: 'success',
      sport: null,
    });
  }

  return next(
    new ForbiddenError('Not allowed! This sport news does not belong to you')
  );
});
