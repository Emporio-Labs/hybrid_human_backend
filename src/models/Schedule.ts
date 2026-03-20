import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    todos: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Todo", required: true },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
