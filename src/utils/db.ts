import mongoose from "mongoose";

export default async function connectDB() {
  const connectionUrl = process.env.MONGODB_URL;
  if (!connectionUrl) {
    throw new Error("Empty connection string for MongoDB connection");
  }
  const connection = await mongoose.connect(connectionUrl, {
    serverSelectionTimeoutMS: 5000,
  });
}
