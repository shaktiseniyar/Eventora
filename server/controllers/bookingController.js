const Booking = require("../models/Booking");
const Event = require("../models/Event");
const OTP = require("../models/OTP");
const { sendOtpEmail, sendBookingEmail } = require("../utils/email");


const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
}

const sendBookingOTP = async (req, res) => {
    const otp = generateOtp();
    await OTP.findOneAndDelete({ email: req.body.email, action: 'event_booking' }); // Remove any eexisting OTP for this email and action
    await OTP.create({
        email: req.body.email,
        otp,
        action: 'event_booking'
    });
    await sendOtpEmail(req.body.email, otp, 'event_booking');
    res.status(200).json({ message: "OTP sent to email for booking verification." });
}

const bookEvent = async (req, res) => {
    const { eventId, otp } = req.body;

    const otpRecord = await OTP.findOne({ email: req.user.email, otp, action: 'event_booking' });
    if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    const event = await Event.findById(eventId);
    if (!event) {
        return res.status(404).json({ message: "Event not found." });
    }

    if (event.totalSeats <= 0) {
        return res.status(400).json({ message: "No seats available for this event." });
    }

    const existingBooking = await Booking.findOne({ userId: req.user._id, eventId: eventId });
    if (existingBooking) {
        return res.status(400).json({ message: "You have already booked this event." });
    }

    const booking = await Booking.create({
        userId: req.user._id,
        eventId: eventId,
        status: 'pending',
        paymentStatus: 'not_paid',
        amount: event.ticketPrice
    });

    await OTP.deleteMany({ email: req.user.email, action: 'event_booking' }); // Remove the OTP after successful booking
    res.status(201).json({ message: "Event booked successfully.", booking });
};


const confirmBooking = async (req, res) => {
    const paymentStatus = req.body.paymentStatus; // 'paid' or 'not_paid'
    if (!['paid', 'not_paid'].includes(paymentStatus)) {
        return res.status(400).json({ message: "Invalid payment status." });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.status === 'confirmed') {
        return res.status(400).json({ message: "Booking is already confirmed." });
    }

    const event = await Event.findById(booking.eventId);
    if (event.totalSeats <= 0) {
        return res.status(400).json({ message: "No seats available for this event." });
    }

    booking.status = 'confirmed';
    if (paymentStatus) {
        booking.paymentStatus = paymentStatus;
    }

    await booking.save();

    event.totalSeats -= 1; // Decrease the available seats
    await event.save();

    await sendBookingEmail(req.user.email, event.title, booking._id);

    res.status(200).json({ message: "Booking confirmed successfully.", booking });
};


const getMyBookings = async (req, res) => {
    const bookings = await Booking.find({ userId: req.user._id }).populate('eventId');
    res.status(200).json(bookings);
}

const cancelBooking = async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
        return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You are not authorized to cancel this booking." });
    }

    booking.status = 'cancelled';
    await booking.save();

    if (booking.status === 'confirmed') {
        const event = await Event.findById(booking.eventId);
        event.totalSeats += 1; // Increase the available seats
        await event.save();
    }

    await booking.remove();
    res.status(200).json({ message: "Booking canceled successfully." });
};

module.exports = {
    sendBookingOTP,
    bookEvent,
    confirmBooking,
    getMyBookings,
    cancelBooking
};