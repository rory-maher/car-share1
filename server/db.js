const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function load() {
  if (!fs.existsSync(DB_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return null; }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

let db = load();

// Reset if db is using the old schema (had daily_rate)
if (!db || (db.cars && db.cars[0] && db.cars[0].daily_rate !== undefined)) {
  db = { cars: [], bookings: [] };
  save(db);
}

let nextCarId     = db.cars.length     ? Math.max(...db.cars.map(c => c.id))     + 1 : 1;
let nextBookingId = db.bookings.length ? Math.max(...db.bookings.map(b => b.id)) + 1 : 1;

module.exports = {
  getCars:        () => db.cars,
  getCarById:     (id) => db.cars.find(c => c.id === id),

  addCar: (name) => {
    const car = { id: nextCarId++, name };
    db.cars.push(car);
    save(db);
    return car;
  },

  deleteCar: (id) => {
    db.cars     = db.cars.filter(c => c.id !== id);
    db.bookings = db.bookings.filter(b => b.car_id !== id);
    save(db);
  },

  getBookings:    (carId) => carId != null ? db.bookings.filter(b => b.car_id === carId) : db.bookings,
  getBookingById: (id) => db.bookings.find(b => b.id === id),

  // Inclusive end_date: conflict if ranges overlap at all
  hasConflict: (car_id, start_date, end_date, excludeId = null) =>
    db.bookings.some(b =>
      b.car_id === car_id &&
      b.status !== 'cancelled' &&
      b.id !== excludeId &&
      !(b.end_date < start_date || b.start_date > end_date)
    ),

  createBooking: (data) => {
    const booking = { id: nextBookingId++, ...data, status: 'confirmed', created_at: new Date().toISOString() };
    db.bookings.push(booking);
    save(db);
    return booking;
  },

  cancelBooking: (id) => {
    const b = db.bookings.find(b => b.id === id);
    if (b) { b.status = 'cancelled'; save(db); }
    return b;
  },
};
