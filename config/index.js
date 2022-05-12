module.exports = {
  environment: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  db: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
  },
  // bucketName: process.env.S3_BUCKET,
  // accessKey: process.env.S3_KEY,
  // secretKey: process.env.S3_SECRET
};
