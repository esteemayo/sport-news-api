const express = require('express');

const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const commentController = require('../controllers/commentController');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.protect);

router
  .route('/')
  .get(commentController.getComments)
  .post(
    authController.restrictTo('user'),
    commentController.sendSportUserIds,
    commentController.createComment
  );

router
  .route('/:id')
  .get(commentController.getComment)
  .patch(commentController.updateComment)
  .delete(commentController.deleteComment);

module.exports = router;
