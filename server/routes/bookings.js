const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { car_id } = req.query;
  res.json(db.getBookings(car_id != null ? Number(car_id) : null));
});

router.post('/', (req, res) => {
  const { car_id, booker, start_date, end_date, note } = req.body;

  if (!car_id || !booker?.trim() || !start_date || !end_date) {
    return res.status(400).json({ error: 'car_id, booker, start_date and end_date are required' });
  }

  const start = new Date(start_date);
  const end   = new Date(end_date);

  if (isNaN(start) || isNaN(end))  return res.status(400).json({ error: 'Invalid date format' });
  if (start > end)                 return res.status(400).json({ error: 'End date must be on or after start date' });

  const carId = Number(car_id);
  if (!db.getCarById(carId)) return res.status(404).json({ error: 'Car not found' });

  if (db.hasConflict(carId, start_date, end_date)) {
    return res.status(409).json({ error: 'Car is already booked for some of those dates' });
  }

  res.status(201).json(db.createBooking({
    car_id: carId,
    booker: booker.trim(),
    start_date,
    end_date,
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
