const BASE = '/api';

const handle = async (res) => {
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || 'Request failed');
  return j;
};

export const getCars    = () => fetch(`${BASE}/cars`).then(handle);
export const addCar     = (name) => fetch(`${BASE}/cars`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }).then(handle);
export const deleteCar  = (id) => fetch(`${BASE}/cars/${id}`, { method: 'DELETE' }).then(handle);

export const getBookings = (carId) =>
  fetch(`${BASE}/bookings${carId != null ? `?car_id=${carId}` : ''}`).then(handle);

export const checkAvailability = (carId, start_date, start_time, end_date, end_time) =>
  fetch(`${BASE}/cars/${carId}/availability?start_date=${start_date}&start_time=${start_time}&end_date=${end_date}&end_time=${end_time}`).then(handle);

export const createBooking = (data) =>
  fetch(`${BASE}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(handle);

export const cancelBooking = (id) =>
  fetch(`${BASE}/bookings/${id}`, { method: 'DELETE' }).then(handle);
