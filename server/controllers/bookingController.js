import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import stripe from "stripe";


// ==========================
// Check Seat Availability
// ==========================
const checkSeatsAvailability = async (showId, selectedSeats) => {
  try {
    const showData = await Show.findById(showId);

    if (!showData) return false;

    const occupiedSeats = showData.occupiedSeats || {};

    const isAnySeatTaken = selectedSeats.some(
      (seat) => occupiedSeats[seat]
    );

    return !isAnySeatTaken;

  } catch (error) {
    console.log(error.message);
    return false;
  }
};


// ==========================
// Create Booking + Stripe
// ==========================
export const createBooking = async (req, res) => {

  try {

    const { userId } = req.auth();
    const { showId, selectedSeats, origin } = req.body;


    // ==========================
    // Check Availability
    // ==========================
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Some selected seats are already booked"
      });
    }


    // ==========================
    // Get Show
    // ==========================
    const showData = await Show.findById(showId).populate("movie");

    if (!showData) {
      return res.json({
        success: false,
        message: "Show not found"
      });
    }


    // ==========================
    // Lock Seats (Atomic)
    // ==========================
    const updateObj = {};
    const conditionObj = { _id: showId };

    selectedSeats.forEach((seat) => {
      updateObj[`occupiedSeats.${seat}`] = userId;
      conditionObj[`occupiedSeats.${seat}`] = { $exists: false };
    });

    const updatedShow = await Show.findOneAndUpdate(
      conditionObj,
      { $set: updateObj },
      { new: true }
    );

    if (!updatedShow) {
      return res.json({
        success: false,
        message: "Seats already occupied. Please refresh."
      });
    }


    // ==========================
    // Create Booking
    // ==========================
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
      paymentStatus: "pending"
    });


    // ==========================
    // Stripe Initialize
    // ==========================
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);


    // ==========================
    // Stripe Line Items
    // ==========================
    const line_items = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: showData.movie.title,
          },
          unit_amount: Math.floor(booking.amount * 100),
        },
        quantity: 1,
      },
    ];


    // ==========================
    // Create Stripe Session
    // ==========================
    const session = await stripeInstance.checkout.sessions.create({

      success_url: `${origin}/loading/my-bookings`,
      cancel_url: `${origin}/my-bookings`,

      line_items,
      mode: "payment",

      metadata: {
        bookingId: booking._id.toString(),
      },

      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

    });


    // ==========================
    // Save Payment Link
    // ==========================
    booking.paymentLink = session.url;
    await booking.save();


    // ==========================
    // Send Response
    // ==========================
    return res.json({
      success: true,
      url: session.url,
    });

  } catch (error) {

    console.log(error.message);

    return res.json({
      success: false,
      message: "Internal Server Error",
    });

  }
};


// ==========================
// Get Occupied Seats
// ==========================
export const getOccupiedSeats = async (req, res) => {

  try {

    const { showId } = req.params;

    const showData = await Show.findById(showId);

    if (!showData) {
      return res.json({
        success: false,
        message: "Show not found"
      });
    }

    const occupiedSeats = Object.keys(showData.occupiedSeats || {});

    return res.json({
      success: true,
      occupiedSeats
    });

  } catch (error) {

    console.log(error.message);

    return res.json({
      success: false,
      message: error.message
    });

  }
};