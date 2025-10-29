const { Decimal } = require('@prisma/client/runtime/library');

const toNumber = (value) => {
  if (value instanceof Decimal) {
    return Number(value.toString());
  }

  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
};

const roundNumber = (value, precision = 2) => {
  const num = Number(value || 0);
  const factor = 10 ** precision;
  return Math.round(num * factor) / factor;
};

const buildWorkoutSummary = (sessions) => {
  const normalizedSessions = sessions.map((session) => {
    const exercises = (session.exercises || []).map((item) => ({
      exerciseId: item.exercise_id,
      name: item.exercise?.name,
      muscleGroup: item.exercise?.muscle_group,
      actualSets: item.actual_sets,
      actualReps: item.actual_reps,
      actualWeightKg: item.actual_weight_kg,
      comments: item.comments,
    }));

    return {
      id: session.id,
      date: session.date?.toISOString?.() || session.date,
      completedAt: session.completed_at?.toISOString?.() || session.completed_at,
      notes: session.notes,
      workoutPlan: session.workout_plan
        ? {
            id: session.workout_plan.id,
            name: session.workout_plan.name,
            dayOfWeek: session.workout_plan.day_of_week,
          }
        : null,
      exercises,
    };
  });

  const totalSessions = normalizedSessions.length;
  const completedSessions = normalizedSessions.filter((session) => Boolean(session.completedAt)).length;
  const skippedSessions = totalSessions - completedSessions;
  const completionRate = totalSessions > 0 ? roundNumber((completedSessions / totalSessions) * 100, 1) : 0;

  return {
    summary: {
      totalSessions,
      completedSessions,
      skippedSessions,
      completionRate,
    },
    sessions: normalizedSessions,
  };
};

const aggregateNutritionDay = (entries) => {
  return entries.reduce(
    (acc, entry) => {
      const portionGrams = toNumber(entry.portion_g || entry.portionG || 0);
      const food = entry.food || {};
      const baseWeight = toNumber(food.weight || 0) || 1;
      const multiplier = baseWeight > 0 ? portionGrams / baseWeight : 1;

      acc.calories += (food.calories || 0) * multiplier;
      acc.protein += (food.protein || 0) * multiplier;
      acc.carbs += (food.carbs || 0) * multiplier;
      acc.fat += (food.fat || 0) * multiplier;

      acc.items.push({
        foodId: food.id,
        name: food.name,
        portionGrams,
        macros: {
          calories: roundNumber((food.calories || 0) * multiplier),
          protein: roundNumber((food.protein || 0) * multiplier),
          carbs: roundNumber((food.carbs || 0) * multiplier),
          fat: roundNumber((food.fat || 0) * multiplier),
        },
      });

      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      items: [],
    }
  );
};

const buildNutritionSummary = (diaries) => {
  const normalizedDays = diaries.map((diary) => {
    const totals = aggregateNutritionDay(diary.entries || []);

    return {
      id: diary.id,
      date: diary.date?.toISOString?.() || diary.date,
      totals: {
        calories: roundNumber(totals.calories),
        protein: roundNumber(totals.protein),
        carbs: roundNumber(totals.carbs),
        fat: roundNumber(totals.fat),
      },
      items: totals.items,
    };
  });

  const trackedDays = normalizedDays.length;
  const totalCalories = normalizedDays.reduce((sum, day) => sum + day.totals.calories, 0);
  const averageCalories = trackedDays > 0 ? roundNumber(totalCalories / trackedDays) : 0;

  return {
    summary: {
      trackedDays,
      totalCalories: roundNumber(totalCalories),
      averageCalories,
    },
    days: normalizedDays,
  };
};

const buildDeviceSummary = (entries) => {
  const normalizedEntries = entries.map((entry) => ({
    id: entry.id,
    date: entry.date?.toISOString?.() || entry.date,
    steps: entry.steps,
    caloriesBurned: entry.calories_burned,
    heartRateAvg: entry.heart_rate_avg,
  }));

  const totalEntries = normalizedEntries.length;
  const totals = normalizedEntries.reduce(
    (acc, entry) => {
      acc.steps += entry.steps || 0;
      acc.caloriesBurned += entry.caloriesBurned || 0;
      acc.heartRate += entry.heartRateAvg || 0;
      return acc;
    },
    { steps: 0, caloriesBurned: 0, heartRate: 0 }
  );

  return {
    summary: {
      totalEntries,
      averageSteps: totalEntries > 0 ? Math.round(totals.steps / totalEntries) : 0,
      averageCaloriesBurned: totalEntries > 0 ? Math.round(totals.caloriesBurned / totalEntries) : 0,
      averageHeartRate: totalEntries > 0 ? Math.round(totals.heartRate / totalEntries) : 0,
    },
    entries: normalizedEntries,
  };
};

const buildFeedbackSummary = (feedback) => {
  if (!Array.isArray(feedback)) {
    return {
      count: 0,
      averageRating: null,
      recent: [],
    };
  }

  const recent = feedback.map((item) => ({
    id: item.id,
    planContext: item.planContext,
    planType: item.planType,
    rating: item.rating,
    feedbackText: item.feedbackText,
    createdAt: item.createdAt?.toISOString?.() || item.createdAt,
  }));

  const count = recent.length;
  const averageRating = count > 0 ? roundNumber(recent.reduce((sum, item) => sum + (item.rating || 0), 0) / count, 2) : null;

  return {
    count,
    averageRating,
    recent,
  };
};

const buildProgressSummary = (logs) => {
  if (!Array.isArray(logs)) {
    return {
      recent: [],
      insights: [],
    };
  }

  const recent = logs.map((log) => {
    const value = log.value !== null && log.value !== undefined ? roundNumber(log.value, 2) : null;
    const previousValue = log.previousValue !== null && log.previousValue !== undefined ? roundNumber(log.previousValue, 2) : null;
    const delta = value !== null && previousValue !== null ? roundNumber(value - previousValue, 2) : null;

    return {
      id: log.id,
      date: log.date?.toISOString?.() || log.date,
      logType: log.logType,
      category: log.category,
      metric: log.metric,
      value,
      previousValue,
      delta,
      notes: log.notes,
    };
  });

  const insights = recent
    .filter((log) => log.delta !== null && Math.abs(log.delta) >= 5)
    .map((log) => {
      const direction = log.delta > 0 ? 'subiu' : 'caiu';
      return `${log.metric || log.logType} ${direction} ${Math.abs(log.delta)} em relação ao período anterior.`;
    });

  return {
    recent,
    insights,
  };
};

const syncProgressLogs = async (prisma, userId, activitySummary, options = {}) => {
  if (!userId || !activitySummary) return;

  const now = new Date();
  const logDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upsertLog = async ({ logType, category, metric, value, notes }) => {
    if (value === null || value === undefined) {
      return;
    }

    const previous = await prisma.progressLog.findFirst({
      where: {
        userId,
        logType,
        date: {
          lt: logDate,
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    await prisma.progressLog.deleteMany({
      where: {
        userId,
        logType,
        date: logDate,
      },
    });

    await prisma.progressLog.create({
      data: {
        userId,
        date: logDate,
        logType,
        category,
        metric: metric || null,
        value,
        previousValue: previous?.value ?? null,
        notes: notes || null,
      },
    });
  };

  const workouts = activitySummary.workouts?.summary;
  if (workouts) {
    const notes = `Completou ${workouts.completedSessions || 0} de ${workouts.totalSessions || 0} sessões nos últimos ${activitySummary.range?.days || options.days || 14} dias.`;
    await upsertLog({
      logType: 'workout_completion',
      category: 'workout',
      metric: 'completion_rate',
      value: workouts.completionRate ?? null,
      notes,
    });
  }

  const nutrition = activitySummary.nutrition?.summary;
  if (nutrition) {
    const notes = `Calorias médias de ${nutrition.averageCalories || 0} kcal em ${nutrition.trackedDays || 0} dias acompanhados.`;
    await upsertLog({
      logType: 'nutrition_average_calories',
      category: 'nutrition',
      metric: 'average_calories',
      value: nutrition.averageCalories ?? null,
      notes,
    });
  }
};

async function getUserActivitySummary(prisma, userId, options = {}) {
  const days = options.days || 14;
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - days);

  const [workoutSessions, foodDiaries, deviceEntries, aiFeedback] = await Promise.all([
    prisma.workoutSession.findMany({
      where: {
        user_id: userId,
        date: {
          gte: start,
        },
      },
      include: {
        workout_plan: true,
        exercises: {
          include: {
            exercise: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: options.maxWorkoutSessions || 20,
    }),
    prisma.foodDiary.findMany({
      where: {
        user_id: userId,
        date: {
          gte: start,
        },
      },
      include: {
        entries: {
          include: {
            food: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: options.maxNutritionDays || 14,
    }),
    prisma.deviceData.findMany({
      where: {
        user_id: userId,
        date: {
          gte: start,
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: options.maxDeviceEntries || 14,
    }),
    prisma.aIFeedback.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: options.maxFeedbackEntries || 10,
    }),
  ]);

  const workouts = buildWorkoutSummary(workoutSessions);
  const nutrition = buildNutritionSummary(foodDiaries);
  const device = buildDeviceSummary(deviceEntries);
  const feedback = buildFeedbackSummary(aiFeedback);

  await syncProgressLogs(prisma, userId, { workouts, nutrition, range: { days } }, options);

  const progressLogs = await prisma.progressLog.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: options.maxProgressLogs || 20,
  });

  const progress = buildProgressSummary(progressLogs);

  return {
    range: {
      start: start.toISOString(),
      end: now.toISOString(),
      days,
    },
    workouts,
    nutrition,
    device,
    feedback,
    progress,
  };
}

module.exports = {
  getUserActivitySummary,
};
