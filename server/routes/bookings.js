const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { car_id } = req.query;
  res.json(db.getBookings(car_id != null ? Number(car_id) : null));
});

router.post('/', (req, res) => {
  const { car_id, booker, start_date, start_time, end_date, end_time, note } = req.body;

  if (!car_id || !booker?.trim() || !start_date || !start_time || !end_date || !end_time) {
    return res.status(400).json({ error: 'car_id, booker, start_date, start_time, end_date and end_time are required' });
  }

  const start = new Date(`${start_date}T${start_time}`);
  const end   = new Date(`${end_date}T${end_time}`);

  if (isNaN(start) || isNaN(end)) return res.status(400).json({ error: 'Invalid date or time' });
  if (start >= end)               return res.status(400).json({ error: 'End must be after start' });

  const carId = Number(car_id);
  if (!db.getCarById(carId)) return res.status(404).json({ error: 'Car not found' });

  if (db.hasConflict(carId, start_date, start_time, end_date, end_time)) {
    return res.status(409).json({ error: 'Car is already booked for some of those times' });
  }

  res.status(201).json(db.createBooking({
    car_id: carId,
    booker: booker.trim(),
    start_date, start_time,
    end_date,   end_time,
    note: note?.trim() || '',
  }));
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  const booking = db.getBookingById(id);
  if (!booking)                       return res.status(404).json({ error: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ error: 'Already cancelled' });
  db.cancelBooking(id);
  res.json({ message: 'Booking cancelled' });
});

module.exports = router;
