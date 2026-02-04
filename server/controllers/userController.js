import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";


// =======================
// Get User Bookings
// =======================
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
};



// =======================
// Add / Remove Favorites
// =======================
export const updateFavorites = async (req, res) => {
  try {
    const { movieId } = req.body;

    // Safety check
    if (!movieId) {
      return res.json({
        success: false,
        message: "Movie ID missing",
      });
    }

    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    // Safe initialize
    let favorites = user.privateMetadata?.favorites || [];

    // Toggle logic
    if (favorites.includes(movieId)) {
      favorites = favorites.filter((id) => id !== movieId);
    } else {
      favorites.push(movieId);
    }

    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        favorites,
      },
    });

    res.json({
      success: true,
      message: favorites.includes(movieId)
        ? "Added to favorites"
        : "Removed from favorites",
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Failed to update favorites",
    });
  }
};



// =======================
// Get Favorites
// =======================
export const getFavorites = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    const favorites = user.privateMetadata?.favorites || [];

    // If no favorites
    if (favorites.length === 0) {
      return res.json({
        success: true,
        movies: [],
      });
    }

    // Fetch movies from DB
    const movies = await Movie.find({
      _id: { $in: favorites },
    });

    res.json({
      success: true,
      movies,
    });
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      message: "Failed to get favorites",
    });
  }
};