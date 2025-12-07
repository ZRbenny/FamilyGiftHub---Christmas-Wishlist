import mongoose from "mongoose";

const giftSchema = new mongoose.Schema(
    {
        familyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Family",
            required: true
        },
        ownerUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: { type: String, required: true },
        description: { type: String },
        link: { type: String },
        price: { type: Number },
        priority: {
            type: String,
            enum: ["high", "medium", "low"],
            default: "medium"
        },
        reservedByUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        collection: "gifts",
        timestamps: true // gives createdAt for sorting
    }
);

const Gift = mongoose.model("Gift", giftSchema);

export default Gift;
