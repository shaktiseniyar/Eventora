const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");
const { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } = require("../controllers/eventController");

// Get all events
router.get('/', getAllEvents);

// Get event by id
router.get('/:id', getEventById);

// Create a new event (Admin only)
router.post('/', protect, admin, createEvent);

// Update an existing event (Admin only)
router.put('/:id', protect, admin, updateEvent);

// Delete an event (Admin only)
router.delete('/:id', protect, admin, deleteEvent);

module.exports = router;