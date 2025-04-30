const mongoose = require('mongoose');

let connected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => { connected = true; })
    .catch(() => { connected = false; });
}

const ContentSchema = new mongoose.Schema({
  category: String,
  data: Object,
  updatedAt: Date
});
const CarouselSchema = new mongoose.Schema({
  data: Object,
  updatedAt: Date
});

const Content = mongoose.models.Content || mongoose.model('Content', ContentSchema);
const Carousel = mongoose.models.Carousel || mongoose.model('Carousel', CarouselSchema);

async function getContent(category) {
  if (!connected) return null;
  const doc = await Content.findOne({ category });
  return doc ? doc.data : null;
}
async function saveContent(category, data) {
  if (!connected) return null;
  return await Content.findOneAndUpdate(
    { category },
    { data, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}
async function getCarouselsMongo() {
  if (!connected) return null;
  const doc = await Carousel.findOne();
  return doc ? doc.data : null;
}
async function saveCarousels(data) {
  if (!connected) return null;
  return await Carousel.findOneAndUpdate(
    {},
    { data, updatedAt: new Date() },
    { upsert: true, new: true }
  );
}

module.exports = { getContent, saveContent, getCarouselsMongo, saveCarousels };
