import { useState, useEffect, useCallback } from 'react';
import { getCars, addCar, deleteCar, getBookings } from './api.js';
import CarItem from './components/CarItem.jsx';
import AddCarModal from './components/AddCarModal.jsx';

export default function App() {
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const reload = useCallback(async () => {
    const [carsData, bookingsData] = await Promise.all([getCars(), getBookings()]);
    setCars(carsData);
    setBookings(bookingsData);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  async function handleAddCar(name) {
    await addCar(name);
    setShowAdd(false);
    reload();
  }

  async function handleDeleteCar(id) {
    if (!window.confirm('Remove this car and all its bookings?')) return;
    await deleteCar(id);
    reload();
  }

  return (
    <div className="app">
      <header>
        <h1>Family Car Booking</h1>
        <button onClick={() => setShowAdd(true)}>+ Add Car</button>
      </header>

      <main>
        {loading ? (
          <p className="status">Loading...</p>
        ) : cars.length === 0 ? (
          <div className="empty-state">
            <p>No cars added yet.</p>
            <button onClick={() => setShowAdd(true)}>+ Add your first car</button>
          </div>
        ) : (
          cars.map(car => (
            <CarItem
              key={car.id}
              car={car}
              bookings={bookings.filter(b => b.car_id === car.id)}
              onBooked={reload}
              onDelete={() => handleDeleteCar(car.id)}
            />
          ))
        )}
      </main>

      {showAdd && <AddCarModal onAdd={handleAddCar} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
