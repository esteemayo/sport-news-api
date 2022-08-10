const slugify = require('slugify');
const mongoose = require('mongoose');

const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A sport news must have a name'],
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
  },
  {
    timestamps: true,
  }
);

sportSchema.index({
  name: 'text',
  detail: 'text',
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

const Sport = mongoose.models.Sport || mongoose.model('Sport', sportSchema);

module.exports = Sport;
