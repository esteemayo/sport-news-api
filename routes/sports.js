const express = require('express');

const authMiddleware = require('../middlewares/authMiddleware');
const sportController = require('../controllers/sportController');

const router = express.Router();

router.get('/details/:slug', sportController.getSportBySlug);

router.get('/search', sportController.searchSport);

router
  .route('/')
  .get(sportController.getSports)
  .post(authMiddleware.protect, sportController.createSport);

router
  .route('/:id')
  .get(sportController.getSportById)
  .patch(authMiddleware.protect, sportController.updateSport)
  .delete(authMiddleware.protect, sportController.deleteSport);

module.exports = router;
