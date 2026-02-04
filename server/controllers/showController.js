import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

/* ===============================
   GET NOW PLAYING MOVIES
================================ */
export const getNowPlayingMovies = async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.themoviedb.org/3/movie/now_playing",
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY?.trim()}`,
        },
        family: 4,
        timeout: 10000,
      }
    );

    res.json({ success: true, movies: data.results });

  } catch (error) {
    console.error("Now Playing Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   ADD NEW SHOW
================================ */
export const addNewShow = async (req, res) => {
  try {
    console.log("👉 AddNewShow Request Body:", req.body);

    const { movieId, showInput, showPrice } = req.body;

    // Validation
    if (!movieId || !Array.isArray(showInput) || !showPrice) {
      return res.status(400).json({
        success: false,
        message: "Invalid data",
      });
    }

    /* ===============================
       CHECK MOVIE IN DB
    ================================ */
    let movie = await Movie.findOne({ id: Number(movieId) });

    if (!movie) {
      console.log(`Fetching movie ${movieId} from TMDB...`);

      const axiosConfig = {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_API_KEY?.trim()}`,
        },
        family: 4,
        timeout: 10000,
      };

      const [detailsRes, creditsRes] = await Promise.all([
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}`,
          axiosConfig
        ),
        axios.get(
          `https://api.themoviedb.org/3/movie/${movieId}/credits`,
          axiosConfig
        ),
      ]);

      const movieData = detailsRes.data;
      const creditData = creditsRes.data;

      movie = await Movie.create({
        id: Number(movieId),
        title: movieData.title,
        overview: movieData.overview,
        poster_path: movieData.poster_path,
        backdrop_path: movieData.backdrop_path,
        genres: movieData.genres,
        casts: creditData.cast,
        release_date: movieData.release_date,
        original_language: movieData.original_language,
        tagline: movieData.tagline || "",
        vote_average: movieData.vote_average,
        runtime: movieData.runtime,
      });
    }

    /* ===============================
       CREATE SHOWS
    ================================ */
    const showsToCreate = [];

    showInput.forEach((show) => {
      const showDate = show.date;
      const time = show.time;

      if (!showDate || !time) return;

      showsToCreate.push({
        movie: movie._id,
        showDateTime: new Date(`${showDate}T${time}`),
        showPrice: Number(showPrice),
        occupiedSeats: [],
      });
    });

    if (showsToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid shows found",
      });
    }

    await Show.insertMany(showsToCreate);

    res.json({
      success: true,
      message: "Shows added successfully",
    });

  } catch (error) {
    console.error("❌ Add Show Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   GET ALL SHOWS (FIXED)
================================ */
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // ✅ FIX: Proper unique movies
    const uniqueMap = new Map();

    shows.forEach((show) => {
      if (show.movie && !uniqueMap.has(show.movie._id.toString())) {
        uniqueMap.set(show.movie._id.toString(), show.movie);
      }
    });

    res.json({
      success: true,
      shows: Array.from(uniqueMap.values()),
    });

  } catch (error) {
    console.error("Get Shows Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ===============================
   GET SINGLE MOVIE SHOW
================================ */
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    });

    const movie = await Movie.findById(movieId);

    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];

      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id,
      });
    });

    res.json({
      success: true,
      movie,
      dateTime,
    });

  } catch (error) {
    console.error("Get Show Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};