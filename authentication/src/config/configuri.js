import "dotenv/config";

const configuri = {
  PORT: process.env.port,
  ACCESS_TOKEN: process.env.access_token,
  REFRESH_TOKEN: process.env.refresh_token,
  MONGO_URI: process.env.mongo_uri,
};

export default configuri;
