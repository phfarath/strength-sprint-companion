const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');

// Get all exercises
router.get('/', async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany();
    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get exercise by id
router.get('/:id', async (req, res) => {
  try {
    const exercise = await prisma.exercise.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new exercise
router.post('/', async (req, res) => {
  try {
    const { name, muscle_group, description } = req.body;
    
    const exercise = await prisma.exercise.create({
      data: {
        name,
        muscle_group,
        description
      }
    });
    
    res.status(201).json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update exercise
router.put('/:id', async (req, res) => {
  try {
    const { name, muscle_group, description } = req.body;
    
    const exercise = await prisma.exercise.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        muscle_group,
        description
      }
    });
    
    res.json(exercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;