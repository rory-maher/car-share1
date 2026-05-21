import { useState } from 'react';
import BookingModal from './BookingModal.jsx';

const MAKE_ICON = { Toyota: '🚗', Honda: '🚗', Ford: '🏎️', Tesla: '⚡', Jeep: '🚙', BMW: '🏎️' };

export default function CarCard({ car }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="car-card">
      <div className="car-icon">{MAKE_ICON[car.make] ?? '🚗'}</div>
      <div className="car-info">
        <h3>{car.year} {car.make} {car.model}</h3>
        <p className="owner">Listed by {car.owner_name}</p>
        <p className="desc">{car.description}</p>
        <div className="car-meta">
          <span>{car.seats} seats</span>
          <span>{car.transmission}</span>
        </div>
      </div>
      <div className="car-footer">
        <span className="price">${car.daily_rate}/day</span>
        <button onClick={() => setShowModal(true)}>Book Now</button>
      </div>
      {showModal && <BookingModal car={car} onClose={() => setShowModal(false)} />}
    </div>
  );
}
