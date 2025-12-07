import mongoose from "mongoose";

const familySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        code: { type: String, required: true, unique: true },
        createdAt: { type: Date, default: Date.now }
    },
    { collection: "families" }
);

const Family = mongoose.model("Family", familySchema);

export default Family;
