import { useEffect, useState } from 'react';
import { getCars } from '../api.js';
import CarCard from './CarCard.jsx';

export default function CarList() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCars()
      .then(setCars)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="status">Loading cars...</p>;
  if (error) return <p className="status error">{error}</p>;

  return (
    <div>
      <h2>Available Cars</h2>
      <div className="car-grid">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </div>
  );
}
