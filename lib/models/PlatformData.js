import mongoose from "mongoose";

const platformDataSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
}, { timestamps: true, optimisticConcurrency: true, minimize: false });

export default mongoose.models.PlatformData || mongoose.model("PlatformData", platformDataSchema);
