import { useState } from 'react';

export default function AddCarModal({ onAdd, onClose }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (name.trim()) onAdd(name.trim());
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2>Add a Car</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Car name
            <input
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Family Toyota, Dad's BMW..."
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit">Add Car</button>
          </div>
        </form>
      </div>
    </div>
  );
}
