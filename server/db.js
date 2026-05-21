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

if (!db || (db.cars && db.cars[0] && db.cars[0].daily_rate !== undefined)) {
  db = { cars: [], bookings: [] };
  save(db);
}

// Migrate bookings that predate time / all_day fields
for (const b of db.bookings) {
  if (!b.start_time) b.start_time = '00:00';
  if (!b.end_time)   b.end_time   = '23:59';
  if (b.all_day === undefined) b.all_day = false;
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

  hasConflict: (car_id, start_date, start_time, end_date, end_time, excludeId = null) => {
    const aStart = new Date(`${start_date}T${start_time}`);
    const aEnd   = new Date(`${end_date}T${end_time}`);
    return db.bookings.some(b => {
      if (b.car_id !== car_id || b.status === 'cancelled' || b.id === excludeId) return false;
      const bStart = new Date(`${b.start_date}T${b.start_time}`);
      const bEnd   = new Date(`${b.end_date}T${b.end_time}`);
      return aStart < bEnd && aEnd > bStart;
    });
  },

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

  cancelGroup: (group_id) => {
    const today = new Date().toISOString().split('T')[0];
    for (const b of db.bookings) {
      if (b.recurring_group_id === group_id && b.status !== 'cancelled' && b.start_date >= today) {
        b.status = 'cancelled';
      }
    }
    save(db);
  },
};
