import { useState } from 'react';
import Calendar from './Calendar.jsx';
import BookingModal from './BookingModal.jsx';
import { cancelBooking } from '../api.js';

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function fmtDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
}

function fmtTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  return m === '00' ? `${Number(h)}:00` : `${Number(h)}:${m}`;
}

export default function CarItem({ car, bookings, onBooked, onDelete }) {
  const [showBook, setShowBook] = useState(false);

  const today = toStr(new Date());
  const upcoming = bookings
    .filter(b => b.status !== 'cancelled' && b.end_date >= today)
    .sort((a, b) => `${a.start_date}T${a.start_time}`.localeCompare(`${b.start_date}T${b.start_time}`));

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await cancelBooking(id);
    onBooked();
  }

  function fmtRange(b) {
    if (b.start_date === b.end_date) {
      return `${fmtDate(b.start_date)}, ${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`;
    }
    return `${fmtDate(b.start_date)} ${fmtTime(b.start_time)} – ${fmtDate(b.end_date)} ${fmtTime(b.end_time)}`;
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
                <span>{fmtRange(b)}</span>
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
