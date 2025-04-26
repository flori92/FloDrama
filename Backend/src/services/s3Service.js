const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
const BUCKET_CONTENT = process.env.S3_BUCKET || 'flodrama-content';
const BUCKET_IMAGES = process.env.S3_BUCKET_IMAGES || 'flodrama-images';

async function getContentByCategory(category) {
  const Key = `content/${category}/index.json`;
  try {
    const data = await s3.getObject({ Bucket: BUCKET_CONTENT, Key }).promise();
    return JSON.parse(data.Body.toString('utf-8'));
  } catch (e) {
    return null;
  }
}

async function putContentByCategory(category, json) {
  const Key = `content/${category}/index.json`;
  await s3.putObject({
    Bucket: BUCKET_CONTENT,
    Key,
    Body: JSON.stringify(json),
    ContentType: 'application/json'
  }).promise();
}

async function getCarousels() {
  const Key = `carousels/index.json`;
  try {
    const data = await s3.getObject({ Bucket: BUCKET_CONTENT, Key }).promise();
    return JSON.parse(data.Body.toString('utf-8'));
  } catch (e) {
    return null;
  }
}

async function getImageFromS3(filename) {
  const Key = `images/${filename}`;
  try {
    return s3.getObject({ Bucket: BUCKET_IMAGES, Key }).createReadStream();
  } catch (e) {
    return null;
  }
}

module.exports = { getContentByCategory, putContentByCategory, getCarousels, getImageFromS3 };
