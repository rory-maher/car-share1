import { useState } from 'react';
import { checkAvailability, createBooking } from '../api.js';

const toStr = (d) => d.toISOString().split('T')[0];
const today = toStr(new Date());

export default function BookingModal({ car, onClose, onBooked }) {
  const [booker,    setBooker]    = useState('');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('09:00');
  const [endDate,   setEndDate]   = useState(today);
  const [endTime,   setEndTime]   = useState('17:00');
  const [note,      setNote]      = useState('');
  const [avail,     setAvail]     = useState(null);
  const [checking,  setChecking]  = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState(null);

  function reset() { setAvail(null); setError(null); }

  function handleStartDateChange(val) {
    setStartDate(val);
    if (val > endDate) setEndDate(val);
    reset();
  }

  function handleStartTimeChange(val) {
    setStartTime(val);
    // if same day, ensure end time is after start time
    if (startDate === endDate && val >= endTime) {
      const [h, m] = val.split(':').map(Number);
      const next = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (h < 23) setEndTime(next);
    }
    reset();
  }

  async function handleCheck() {
    setChecking(true); setError(null);
    try {
      const { available } = await checkAvailability(car.id, startDate, startTime, endDate, endTime);
      setAvail(available);
    } catch (e) { setError(e.message); }
    finally { setChecking(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const start = new Date(`${startDate}T${startTime}`);
    const end   = new Date(`${endDate}T${endTime}`);
    if (start >= end) { setError('End must be after start'); return; }
    setSubmitting(true); setError(null);
    try {
      await createBooking({ car_id: car.id, booker, start_date: startDate, start_time: startTime, end_date: endDate, end_time: endTime, note });
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
            <input required autoFocus value={booker} onChange={e => { setBooker(e.target.value); reset(); }} placeholder="Dad / Rory / ..." />
          </label>

          <div className="datetime-row">
            <label>
              From date
              <input required type="date" min={today} value={startDate} onChange={e => handleStartDateChange(e.target.value)} />
            </label>
            <label>
              From time
              <input required type="time" value={startTime} onChange={e => handleStartTimeChange(e.target.value)} />
            </label>
          </div>

          <div className="datetime-row">
            <label>
              To date
              <input required type="date" min={startDate} value={endDate} onChange={e => { setEndDate(e.target.value); reset(); }} />
            </label>
            <label>
              To time
              <input required type="time" value={endTime} onChange={e => { setEndTime(e.target.value); reset(); }} />
            </label>
          </div>

          <label>
            Note <span className="optional">(optional)</span>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. trip to Galway" />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={handleCheck} disabled={checking}>
              {checking ? 'Checking...' : 'Check Times'}
            </button>
            <button type="submit" disabled={submitting || avail === false}>
              {submitting ? 'Booking...' : 'Confirm'}
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
