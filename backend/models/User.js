import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        familyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true
        },
        displayName: { type: String, required: true }
    },
    { collection: "users" }
);

const User = mongoose.model("User", userSchema);

export default User;
