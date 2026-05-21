import { useState } from 'react';
import { checkAvailability, createBooking } from '../api.js';

const toStr = (d) => d.toISOString().split('T')[0];
const today = toStr(new Date());

export default function BookingModal({ car, onClose, onBooked }) {
  const [booker,    setBooker]    = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState(today);
  const [note,      setNote]      = useState('');
  const [avail,     setAvail]     = useState(null);
  const [checking,  setChecking]  = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState(null);

  function reset() { setAvail(null); setError(null); }

  async function handleCheck() {
    setChecking(true); setError(null);
    try {
      const { available } = await checkAvailability(car.id, startDate, endDate);
      setAvail(available);
    } catch (e) { setError(e.message); }
    finally { setChecking(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      await createBooking({ car_id: car.id, booker, start_date: startDate, end_date: endDate, note });
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
            <input
              required
              autoFocus
              value={booker}
              onChange={e => { setBooker(e.target.value); reset(); }}
              placeholder="Dad / Rory / ..."
            />
          </label>
          <div className="date-row">
            <label>
              From
              <input
                required type="date" min={today} value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                  reset();
                }}
              />
            </label>
            <label>
              To
              <input
                required type="date" min={startDate} value={endDate}
                onChange={e => { setEndDate(e.target.value); reset(); }}
              />
            </label>
          </div>
          <label>
            Note <span className="optional">(optional)</span>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. trip to Galway" />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary" onClick={handleCheck} disabled={checking}>
              {checking ? 'Checking...' : 'Check Dates'}
            </button>
            <button type="submit" disabled={submitting || avail === false}>
              {submitting ? 'Booking...' : 'Confirm'}
            </button>
          </div>

          {avail === true  && <p className="avail-ok">Those dates are free!</p>}
          {avail === false && <p className="avail-no">Already booked for some of those dates.</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
