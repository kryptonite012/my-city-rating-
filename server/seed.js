// Loads the sample Greater Noida places and reviews into MongoDB.
// Usage: npm run seed   (wipes existing places and reviews first)
require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Place = require("./models/Place");
const Review = require("./models/Review");
const { places, reviews } = require("../client/src/data/seed.json");

const DAY_MS = 86400000;

async function seed() {
    await connectDB();
    await Promise.all([Place.deleteMany({}), Review.deleteMany({})]);

    for (const { _id, ...data } of places) {
        const place = await Place.create(data);
        const placeReviews = (reviews[_id] || []).map(({ _id: _rid, userId: _uid, daysAgo, ...r }) => ({
            ...r,
            placeId: place._id,
            createdAt: new Date(Date.now() - daysAgo * DAY_MS),
        }));
        await Review.insertMany(placeReviews);
    }

    console.log(`Seeded ${places.length} places and ${Object.values(reviews).flat().length} reviews.`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
