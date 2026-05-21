const express = require('express');
const router = express.Router();
const db = require('../db');

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

router.get('/', (req, res) => {
  const { car_id } = req.query;
  res.json(db.getBookings(car_id != null ? Number(car_id) : null));
});

// Cancel a whole recurring series
router.delete('/group/:group_id', (req, res) => {
  db.cancelGroup(req.params.group_id);
  res.json({ message: 'Series cancelled' });
});

router.post('/', (req, res) => {
  const { car_id, booker, start_time, end_time, all_day, note, recurring, start_date, end_date } = req.body;

  if (!car_id || !booker?.trim()) {
    return res.status(400).json({ error: 'car_id and booker are required' });
  }

  const carId = Number(car_id);
  if (!db.getCarById(carId)) return res.status(404).json({ error: 'Car not found' });

  const st = all_day ? '00:00' : start_time;
  const et = all_day ? '23:59' : end_time;

  // ── Recurring booking ──────────────────────────────────────────────────────
  if (recurring) {
    const { days, from_date, until_date } = recurring;
    if (!days?.length || !from_date || !until_date) {
      return res.status(400).json({ error: 'days, from_date and until_date are required for recurring bookings' });
    }

    // Expand into individual dates
    const dates = [];
    let d = new Date(from_date + 'T00:00:00');
    const endD = new Date(until_date + 'T00:00:00');
    while (d <= endD) {
      if (days.includes(d.getDay())) dates.push(toStr(d));
      d.setDate(d.getDate() + 1);
    }

    if (dates.length === 0) {
      return res.status(400).json({ error: 'No matching dates found in that range' });
    }

    // Check all conflicts before creating any
    for (const date of dates) {
      if (db.hasConflict(carId, date, st, date, et)) {
        return res.status(409).json({ error: `Car is already booked on ${date} at that time` });
      }
    }

    const group_id = `r_${Date.now()}`;
    dates.forEach(date => db.createBooking({
      car_id: carId,
      booker: booker.trim(),
      all_day: !!all_day,
      start_date: date, start_time: st,
      end_date:   date, end_time:   et,
      note: note?.trim() || '',
      recurring_group_id: group_id,
    }));

    return res.status(201).json({ count: dates.length });
  }

  // ── Single booking ─────────────────────────────────────────────────────────
  if (!start_date || !st || !end_date || !et) {
    return res.status(400).json({ error: 'start_date, end_date and times are required' });
  }

  const start = new Date(`${start_date}T${st}`);
  const end   = new Date(`${end_date}T${et}`);

  if (isNaN(start) || isNaN(end)) return res.status(400).json({ error: 'Invalid date or time' });
  if (start >= end)               return res.status(400).json({ error: 'End must be after start' });

  if (db.hasConflict(carId, start_date, st, end_date, et)) {
    return res.status(409).json({ error: 'Car is already booked for some of those times' });
  }

  res.status(201).json(db.createBooking({
    car_id: carId,
    booker: booker.trim(),
    all_day: !!all_day,
    start_date, start_time: st,
    end_date,   end_time:   et,
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
