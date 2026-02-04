import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
    {
        // ❌ _id wali line hata di hai. (MongoDB isse khud handle karega)
        
        // ✅ TMDB ID store karne ke liye naya field
        id: { type: Number, required: true, unique: true }, 

        title: { type: String, required: true },
        overview: { type: String, required: true },
        poster_path: { type: String, required: true },
        backdrop_path: { type: String, required: true },
        release_date: { type: String, required: true },
        original_language: { type: String },
        tagline: { type: String },
        
        // Arrays ko thoda detail mein define kar sakte hain (Optional but better)
        genres: [], 
        casts: [], 
        
        vote_average: { type: Number, required: true },
        runtime: { type: Number, required: true },
    }, 
    { timestamps: true }
)

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);

export default Movie;