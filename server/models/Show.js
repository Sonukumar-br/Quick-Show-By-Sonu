import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
    // Galti yahan thi: Hamein 'Movie' schema embed nahi karna, sirf Reference dena hai
    movie: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Movie', // Yeh name models/Movie.js ke model name se match hona chahiye
        required: true 
    },
    showDateTime: {
        type: Date,
        required: true
    },
    showPrice: {
        type: Number,
        required: true
    },
    occupiedSeats: {
        type: Object,
        default: {}
    }
}, { timestamps: true });

const Show = mongoose.models.Show || mongoose.model("Show", showSchema);

export default Show;