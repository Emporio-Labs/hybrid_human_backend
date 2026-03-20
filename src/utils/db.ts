import mongoose from "mongoose";

export default async function connectDB() {
  try {
    const connectionUrl = process.env.MONGODB_URL;

    if (!connectionUrl) {
      throw new Error("Empty connection string for MongoDB connection");
    }

    await mongoose.connect(connectionUrl, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
