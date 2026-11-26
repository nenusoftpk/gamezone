import mongoose from "mongoose";

const superadminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, default: "Platform Team" },
  role: { type: String, required: true, enum: ["superadmin"], unique: true, default: "superadmin" },
}, { timestamps: true });

export default mongoose.models.Superadmin || mongoose.model("Superadmin", superadminSchema);
