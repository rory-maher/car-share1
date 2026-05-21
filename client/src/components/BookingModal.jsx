import { useState } from 'react';
import { checkAvailability, createBooking } from '../api.js';

const toStr = (d) => d.toISOString().split('T')[0];
const today     = toStr(new Date());
const nextMonth = toStr(new Date(Date.now() + 30 * 86400000));

const WEEKDAYS = [
  { label: 'Mo', value: 1 }, { label: 'Tu', value: 2 }, { label: 'We', value: 3 },
  { label: 'Th', value: 4 }, { label: 'Fr', value: 5 }, { label: 'Sa', value: 6 },
  { label: 'Su', value: 0 },
];

export default function BookingModal({ car, onClose, onBooked }) {
  const [booker,     setBooker]     = useState('');
  const [allDay,     setAllDay]     = useState(false);
  const [recurring,  setRecurring]  = useState(false);
  const [note,       setNote]       = useState('');

  // Single booking
  const [startDate,  setStartDate]  = useState(today);
  const [endDate,    setEndDate]    = useState(today);

  // Shared times
  const [startTime,  setStartTime]  = useState('09:00');
  const [endTime,    setEndTime]    = useState('17:00');

  // Recurring
  const [recurDays,  setRecurDays]  = useState([]);
  const [recurFrom,  setRecurFrom]  = useState(today);
  const [recurUntil, setRecurUntil] = useState(nextMonth);

  const [avail,      setAvail]      = useState(null);
  const [checking,   setChecking]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  function reset() { setAvail(null); setError(null); }

  function toggleDay(val) {
    setRecurDays(d => d.includes(val) ? d.filter(x => x !== val) : [...d, val]);
    reset();
  }

  async function handleCheck() {
    setChecking(true); setError(null);
    try {
      const st = allDay ? '00:00' : startTime;
      const et = allDay ? '23:59' : endTime;
      const { available } = await checkAvailability(car.id, startDate, st, endDate, et);
      setAvail(available);
    } catch (e) { setError(e.message); }
    finally { setChecking(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const st = allDay ? '00:00' : startTime;
    const et = allDay ? '23:59' : endTime;

    if (recurring) {
      if (recurDays.length === 0) { setError('Select at least one day'); return; }
    } else {
      if (new Date(`${startDate}T${st}`) >= new Date(`${endDate}T${et}`)) {
        setError('End must be after start'); return;
      }
    }

    setSubmitting(true); setError(null);
    try {
      if (recurring) {
        await createBooking({
          car_id: car.id, booker, all_day: allDay,
          start_time: st, end_time: et, note,
          recurring: { days: recurDays, from_date: recurFrom, until_date: recurUntil },
        });
      } else {
        await createBooking({
          car_id: car.id, booker, all_day: allDay,
          start_date: startDate, start_time: st,
          end_date: endDate,     end_time: et,
          note,
        });
      }
      onBooked();
    } catch (e) { setError(e.message); setSubmitting(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Book {car.name}</h2>
        <form onSubmit={handleSubmit}>

          <label>
            Your name
            <input required autoFocus value={booker}
              onChange={e => { setBooker(e.target.value); reset(); }}
              placeholder="Dad / Rory / ..." />
          </label>

          <div className="toggle-row">
            <label className="toggle-label">
              <input type="checkbox" checked={allDay} onChange={e => { setAllDay(e.target.checked); reset(); }} />
              All day
            </label>
            <label className="toggle-label">
              <input type="checkbox" checked={recurring} onChange={e => { setRecurring(e.target.checked); reset(); }} />
              Repeat weekly
            </label>
          </div>

          {recurring ? (
            <>
              <div className="day-selector">
                {WEEKDAYS.map(({ label, value }) => (
                  <button key={label} type="button"
                    className={`day-btn${recurDays.includes(value) ? ' active' : ''}`}
                    onClick={() => toggleDay(value)}>
                    {label}
                  </button>
                ))}
              </div>
              {!allDay && (
                <div className="datetime-row">
                  <label>From time
                    <input required type="time" value={startTime} onChange={e => { setStartTime(e.target.value); reset(); }} />
                  </label>
                  <label>To time
                    <input required type="time" value={endTime} onChange={e => { setEndTime(e.target.value); reset(); }} />
                  </label>
                </div>
              )}
              <div className="datetime-row">
                <label>Starting
                  <input required type="date" min={today} value={recurFrom}
                    onChange={e => { setRecurFrom(e.target.value); if (e.target.value > recurUntil) setRecurUntil(e.target.value); reset(); }} />
                </label>
                <label>Until
                  <input required type="date" min={recurFrom} value={recurUntil}
                    onChange={e => { setRecurUntil(e.target.value); reset(); }} />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="datetime-row">
                <label>From date
                  <input required type="date" min={today} value={startDate}
                    onChange={e => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value); reset(); }} />
                </label>
                {!allDay && (
                  <label>From time
                    <input required type="time" value={startTime} onChange={e => { setStartTime(e.target.value); reset(); }} />
                  </label>
                )}
              </div>
              <div className="datetime-row">
                <label>To date
                  <input required type="date" min={startDate} value={endDate}
                    onChange={e => { setEndDate(e.target.value); reset(); }} />
                </label>
                {!allDay && (
                  <label>To time
                    <input required type="time" value={endTime} onChange={e => { setEndTime(e.target.value); reset(); }} />
                  </label>
                )}
              </div>
            </>
          )}

          <label>
            Note <span className="optional">(optional)</span>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. trip to Galway" />
          </label>

          <div className="modal-actions">
            {!recurring && (
              <button type="button" className="secondary" onClick={handleCheck} disabled={checking}>
                {checking ? 'Checking...' : 'Check Times'}
              </button>
            )}
            <button type="submit" disabled={submitting || avail === false} style={{ flex: 1 }}>
              {submitting ? 'Booking...' : recurring ? 'Book series' : 'Confirm'}
            </button>
          </div>

          {avail === true  && <p className="avail-ok">Those times are free!</p>}
          {avail === false && <p className="avail-no">Already booked for some of those times.</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
