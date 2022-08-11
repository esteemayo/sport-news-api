const slugify = require('slugify');
const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A sport news must have a name'],
      maxlength: [
        30,
        'A sport news name must have less or equal than 50 characters',
      ],
      minlength: [
        10,
        'A sport news name must have equal or more than 10 characters',
      ],
    },
    slug: String,
    detail: {
      type: String,
      trim: true,
      required: [true, 'A sport news must have a detail field'],
    },
    date: {
      type: Date,
      required: [true, 'A sport news must have a date'],
    },
    time: {
      type: String,
      required: [true, 'A sport news must have a time field'],
    },
    image: {
      type: String,
      default: '',
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'A sport news must belong to a user'],
    },
    likes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sportSchema.index({
  name: 'text',
  detail: 'text',
});

sportSchema.index({ name: 1, slug: 1 });

sportSchema.virtual('comments', {
  ref: 'Comment',
  foreignField: 'sport',
  localField: '_id',
});

sportSchema.pre('save', async function (next) {
  if (!this.isModified('name')) return next();
  this.slug = slugify(this.name, { lower: true });

  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const sportWithSlug = await this.constructor.find({ slug: slugRegEx });

  if (sportWithSlug.length) {
    this.slug = `${this.slug}-${sportWithSlug.length + 1}`;
  }
});

sportSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'username',
  });

  next();
});

const Sport = mongoose.models.Sport || mongoose.model('Sport', sportSchema);

module.exports = Sport;
