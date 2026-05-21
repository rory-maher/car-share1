const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => res.json(db.getCars()));

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Car name is required' });
  res.status(201).json(db.addCar(name.trim()));
});

router.delete('/:id', (req, res) => {
  const car = db.getCarById(Number(req.params.id));
  if (!car) return res.status(404).json({ error: 'Car not found' });
  db.deleteCar(Number(req.params.id));
  res.json({ message: 'Car removed' });
});

router.get('/:id/availability', (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'start and end required' });
  res.json({ available: !db.hasConflict(Number(req.params.id), start, end) });
});

module.exports = router;
