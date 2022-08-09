const express = require('express');

const sportController = require('../controllers/sportController');

const router = express.Router();

router.get('/details/:slug', sportController.getSportBySlug);

router
  .route('/')
  .get(sportController.getSports)
  .post(sportController.createSport);

router
  .route('/:id')
  .get(sportController.getSportById)
  .patch(sportController.updateSport)
  .delete(sportController.deleteSport);

module.exports = router;
