import { useState } from 'react';
import { getBookings, cancelBooking } from '../api.js';

export default function MyBookings({ email, onEmailChange }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await getBookings(email);
      setBookings(data);
      setSearched(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await cancelBooking(id);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
      );
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div>
      <h2>My Bookings</h2>
      <form className="email-search" onSubmit={handleSearch}>
        <input
          type="email"
          required
          placeholder="Enter your email to find bookings"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find Bookings'}
        </button>
      </form>

      {error && <p className="status error">{error}</p>}
      {searched && bookings.length === 0 && (
        <p className="status">No bookings found for {email}.</p>
      )}

      {bookings.length > 0 && (
        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b.id} className={`booking-card ${b.status}`}>
              <div className="booking-info">
                <h3>
                  {b.year} {b.make} {b.model}
                  <span className={`badge ${b.status}`}>{b.status}</span>
                </h3>
                <p>{b.start_date} &rarr; {b.end_date}</p>
                <p>Total: <strong>${b.total_price}</strong></p>
                <p className="booking-id">Booking #{b.id}</p>
              </div>
              {b.status === 'confirmed' && (
                <button className="cancel-btn" onClick={() => handleCancel(b.id)}>
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
