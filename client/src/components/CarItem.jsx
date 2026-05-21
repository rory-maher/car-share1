import { useState } from 'react';
import Calendar from './Calendar.jsx';
import BookingModal from './BookingModal.jsx';
import { cancelBooking } from '../api.js';

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function CarItem({ car, bookings, onBooked, onDelete }) {
  const [showBook, setShowBook] = useState(false);

  const today = toStr(new Date());
  const upcoming = bookings
    .filter(b => b.status !== 'cancelled' && b.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await cancelBooking(id);
    onBooked();
  }

  function fmtDate(d) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  }

  return (
    <div className="car-item">
      <div className="car-item-header">
        <h2>{car.name}</h2>
        <div className="car-item-actions">
          <button onClick={() => setShowBook(true)}>+ Book</button>
          <button className="danger" onClick={onDelete}>Remove</button>
        </div>
      </div>

      <Calendar bookings={bookings} />

      {upcoming.length > 0 && (
        <div className="booking-list">
          <h3>Upcoming bookings</h3>
          {upcoming.map(b => (
            <div key={b.id} className="booking-row">
              <div className="booking-row-info">
                <strong>{b.booker}</strong>
                <span>{fmtDate(b.start_date)} – {fmtDate(b.end_date)}</span>
                {b.note && <span className="booking-note">{b.note}</span>}
              </div>
              <button className="cancel-btn" onClick={() => handleCancel(b.id)}>Cancel</button>
            </div>
          ))}
        </div>
      )}

      {showBook && (
        <BookingModal
          car={car}
          onClose={() => setShowBook(false)}
          onBooked={() => { setShowBook(false); onBooked(); }}
        />
      )}
    </div>
  );
}
