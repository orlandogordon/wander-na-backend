const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../config.env') });

const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Review = require('../models/reviewModel');

const DB = process.env.DATABASE;
const dataDir = path.join(__dirname, 'data');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
const oid = (v) =>
  typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v)
    ? new mongoose.Types.ObjectId(v)
    : v;

// This repo's difficulty enum is easy|medium|hard|expert; the canonical
// Natours dataset uses "difficult" -> map it to "hard".
const tours = read('tours.json').map((t) => ({
  ...t,
  difficulty: t.difficulty === 'difficult' ? 'hard' : t.difficulty,
}));
const users = read('users.json');
const reviews = read('reviews.json');

const importData = async () => {
  // Users: native insert preserves the pre-hashed passwords and skips the
  // pre-save bcrypt hook (which would otherwise double-hash them).
  await User.collection.insertMany(users.map((u) => ({ ...u, _id: oid(u._id) })));
  console.log(`${users.length} users imported`);

  // Tours: create() runs the slug pre-save hook (frontend routes by slug).
  await Tour.create(tours);
  console.log(`${tours.length} tours imported`);

  // Reviews: native insert with ObjectId-cast refs; tour ratings stay as baked.
  await Review.collection.insertMany(
    reviews.map((r) => ({ ...r, _id: oid(r._id), tour: oid(r.tour), user: oid(r.user) }))
  );
  console.log(`${reviews.length} reviews imported`);
};

const deleteData = async () => {
  await Tour.deleteMany();
  await User.deleteMany();
  await Review.deleteMany();
  console.log('Existing tour/user/review data cleared');
};

(async () => {
  await mongoose.connect(DB);
  console.log('DB connected');
  try {
    if (process.argv[2] === '--delete') {
      await deleteData();
    } else if (process.argv[2] === '--import') {
      await deleteData();
      await importData();
    } else {
      console.log('Usage: node dev-data/importData.js --import | --delete');
    }
  } catch (err) {
    console.error('Import error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
})();
