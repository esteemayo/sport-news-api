const express = require('express');

const commentRouter = require('./comments');
const authMiddleware = require('../middlewares/authMiddleware');
const sportController = require('../controllers/sportController');

const router = express.Router();

router.use('/:sportId/comments', commentRouter);

router.get('/details/:slug', sportController.getSportBySlug);

router.get('/search', sportController.searchSport);

router.get(
  '/user-sports',
  authMiddleware.protect,
  sportController.getUserSports
);

router.patch(
  '/like-sport/:id',
  authMiddleware.protect,
  sportController.likeSport
);

router
  .route('/')
  .get(sportController.getSports)
  .post(authMiddleware.protect, sportController.createSport);

router
  .route('/:id')
  .get(authMiddleware.protect, sportController.getSportById)
  .patch(authMiddleware.protect, sportController.updateSport)
  .delete(authMiddleware.protect, sportController.deleteSport);

module.exports = router;
