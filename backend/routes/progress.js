const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get workout sessions for user
router.get('/workout', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const sessions = await prisma.workoutSession.findMany({
      where: { user_id: userId },
      include: {
        exercises: {
          include: {
            exercise: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    res.json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get food diary entries for user
router.get('/nutrition', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const diaries = await prisma.foodDiary.findMany({
      where: { user_id: userId },
      include: {
        entries: {
          include: {
            food: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    res.json(diaries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add device data
router.post('/device', auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const { date, steps, calories_burned, heart_rate_avg } = req.body;
    
    const deviceData = await prisma.deviceData.create({
      data: {
        date: new Date(date),
        steps,
        calories_burned,
        heart_rate_avg,
        user: { connect: { id: userId } }
      }
    });
    
    res.status(201).json(deviceData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;