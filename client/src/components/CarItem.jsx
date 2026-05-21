import { useState } from 'react';
import Calendar from './Calendar.jsx';
import BookingModal from './BookingModal.jsx';
import { cancelBooking, cancelGroup } from '../api.js';

const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

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
function fmtRange(b) {
  if (b.all_day) {
    return b.start_date === b.end_date
      ? `${fmtDate(b.start_date)}, all day`
      : `${fmtDate(b.start_date)} – ${fmtDate(b.end_date)}, all day`;
  }
  return b.start_date === b.end_date
    ? `${fmtDate(b.start_date)}, ${fmtTime(b.start_time)} – ${fmtTime(b.end_time)}`
    : `${fmtDate(b.start_date)} ${fmtTime(b.start_time)} – ${fmtDate(b.end_date)} ${fmtTime(b.end_time)}`;
}

export default function CarItem({ car, bookings, onBooked, onDelete }) {
  const [showBook, setShowBook] = useState(false);

  const today = toStr(new Date());
  const upcoming = bookings
    .filter(b => b.status !== 'cancelled' && b.end_date >= today)
    .sort((a, b) => `${a.start_date}T${a.start_time}`.localeCompare(`${b.start_date}T${b.start_time}`));

  // Split into regular and recurring groups
  const regular = upcoming.filter(b => !b.recurring_group_id);

  const groupMap = {};
  for (const b of upcoming.filter(b => b.recurring_group_id)) {
    if (!groupMap[b.recurring_group_id]) groupMap[b.recurring_group_id] = [];
    groupMap[b.recurring_group_id].push(b);
  }
  const recurringGroups = Object.values(groupMap).map(items => {
    const days = [...new Set(items.map(b => new Date(b.start_date + 'T00:00:00').getDay()))].sort();
    return {
      groupId:    items[0].recurring_group_id,
      booker:     items[0].booker,
      start_time: items[0].start_time,
      end_time:   items[0].end_time,
      all_day:    items[0].all_day,
      note:       items[0].note,
      days,
      count:      items.length,
      nextDate:   items[0].start_date,
    };
  });

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await cancelBooking(id);
    onBooked();
  }

  async function handleCancelGroup(groupId) {
    if (!window.confirm('Cancel all upcoming occurrences in this series?')) return;
    await cancelGroup(groupId);
    onBooked();
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

      {(regular.length > 0 || recurringGroups.length > 0) && (
        <div className="booking-list">
          <h3>Upcoming bookings</h3>

          {regular.map(b => (
            <div key={b.id} className="booking-row">
              <div className="booking-row-info">
                <strong>{b.booker}</strong>
                <span>{fmtRange(b)}</span>
                {b.note && <span className="booking-note">{b.note}</span>}
              </div>
              <button className="cancel-btn" onClick={() => handleCancel(b.id)}>Cancel</button>
            </div>
          ))}

          {recurringGroups.map(g => (
            <div key={g.groupId} className="booking-row">
              <div className="booking-row-info">
                <strong>
                  {g.booker}
                  <span className="recur-badge">weekly</span>
                </strong>
                <span>{g.days.map(d => DAY_NAMES[d]).join(' / ')} · {g.all_day ? 'all day' : `${fmtTime(g.start_time)} – ${fmtTime(g.end_time)}`}</span>
                <span>{g.count} occurrence{g.count !== 1 ? 's' : ''} · next: {fmtDate(g.nextDate)}</span>
                {g.note && <span className="booking-note">{g.note}</span>}
              </div>
              <button className="cancel-btn" onClick={() => handleCancelGroup(g.groupId)}>Cancel series</button>
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
