# AI Personalization & Memory Features

## Overview

The AI assistant now includes comprehensive personalization capabilities, activity memory, and a feedback loop to continuously improve plan generation. This document outlines the new features and how they work.

## Key Features

### 1. Extended User Profile

Users can now specify additional profile information that the AI uses for personalization:

- **Gender**: male, female, other, prefer-not-to-say
- **Fitness Level**: beginner, intermediate, advanced
- **Goal**: lose-weight, gain-muscle, improve-health, increase-strength, improve-endurance
- **Available Days**: Number of days per week available for training
- **Equipment**: none, home, gym, full-gym
- **Injuries**: Text/JSON describing injuries or physical limitations
- **Workout Preferences**: Preferred workout styles and exercises
- **Dietary Restrictions**: Allergies, intolerances, dietary choices (vegetarian, vegan, etc.)
- **Food Preferences**: Liked/disliked foods

### 2. Activity Memory & Context-Aware Generation

The AI now considers the user's recent activity when generating plans:

#### Activity Summary Includes:
- **Workout History** (last 14 days):
  - Total sessions planned vs. completed
  - Completion rate percentage
  - Recent workout names and exercises performed
  
- **Nutrition Tracking**:
  - Days tracked
  - Average daily calorie intake
  - Recent daily totals (calories, protein, carbs, fat)
  
- **Device Data** (if available):
  - Steps, calories burned, heart rate
  
- **Feedback History**:
  - Previous ratings on workout/nutrition plans
  - Specific comments and preferences

#### Adaptive Behavior:
- If completion rate is high (>80%), the AI may increase difficulty
- If completion rate is low (<50%), the AI maintains or reduces intensity
- Exercises with negative feedback are avoided in future plans
- Successful elements from highly-rated plans are preserved

### 3. Feedback Loop

Users can provide feedback on AI-generated plans using a rating widget:

- **5-star rating system** (1-5 stars)
- **Optional text feedback** for detailed comments
- Feedback is stored and used to inform future AI generations
- Helps the AI learn user preferences over time

## API Endpoints

### Activity Summary

```
GET /api/users/:userId/activity-summary?days=14
Authorization: Bearer <token>
```

**Response:**
```json
{
  "range": {
    "start": "2024-01-01T00:00:00.000Z",
    "end": "2024-01-15T00:00:00.000Z",
    "days": 14
  },
  "workouts": {
    "summary": {
      "totalSessions": 10,
      "completedSessions": 8,
      "skippedSessions": 2,
      "completionRate": 80
    },
    "sessions": [...]
  },
  "nutrition": {
    "summary": {
      "trackedDays": 12,
      "totalCalories": 24000,
      "averageCalories": 2000
    },
    "days": [...]
  },
  "feedback": {
    "count": 5,
    "averageRating": 4.2,
    "recent": [...]
  }
}
```

### AI Feedback

#### Submit Feedback
```
POST /api/ai/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "planContext": "ai-workout-1234567890",
  "planType": "workout",
  "planContent": "{...}",
  "rating": 5,
  "feedbackText": "Loved this workout plan!"
}
```

#### Get Feedback History
```
GET /api/ai/feedback?limit=20
Authorization: Bearer <token>
```

### Profile Update

The existing profile update endpoint now accepts the new fields:

```
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "weight": 75,
  "height": 180,
  "birthdate": "1990-01-01",
  "gender": "male",
  "fitnessLevel": "intermediate",
  "goal": "gain-muscle",
  "availableDays": 5,
  "equipment": "full-gym",
  "injuries": "Previous knee injury - avoid deep squats",
  "workoutPreferences": "Prefer compound movements, enjoy deadlifts and bench press",
  "dietaryRestrictions": "Lactose intolerant",
  "foodPreferences": "Love chicken, rice, vegetables; dislike seafood"
}
```

## Database Schema

### Extended User Table

```sql
ALTER TABLE users ADD COLUMN gender TEXT;
ALTER TABLE users ADD COLUMN fitnessLevel TEXT;
ALTER TABLE users ADD COLUMN goal TEXT;
ALTER TABLE users ADD COLUMN availableDays INTEGER;
ALTER TABLE users ADD COLUMN equipment TEXT;
ALTER TABLE users ADD COLUMN injuries TEXT;
ALTER TABLE users ADD COLUMN workoutPreferences TEXT;
ALTER TABLE users ADD COLUMN dietaryRestrictions TEXT;
ALTER TABLE users ADD COLUMN foodPreferences TEXT;
```

### New AIFeedback Table

```sql
CREATE TABLE ai_feedback (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planContext TEXT NOT NULL,
  planType TEXT,
  planContent TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedbackText TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_feedback_user_context ON ai_feedback(userId, planContext);
```

## Frontend Components

### AIFeedbackWidget

A reusable component for collecting user feedback on AI-generated plans:

```tsx
import { AIFeedbackWidget } from '@/components/ai/AIFeedbackWidget';

<AIFeedbackWidget
  planContext="ai-workout-12345"
  planType="workout"
  planContent={generatedPlan}
  onFeedbackSubmitted={() => console.log('Feedback submitted!')}
/>
```

## How It Works

### Workout Plan Generation Flow

1. **User Request**: User asks for a new workout plan via AI Assistant
2. **Profile Fetch**: System retrieves user's profile with all personalization fields
3. **Activity Summary**: System fetches last 14 days of workout history and feedback
4. **AI Prompt**: Enhanced prompt includes:
   - User profile data (age, weight, goals, preferences, limitations)
   - Recent workout completion rate
   - Previous feedback on exercises
   - Adaptive recommendations based on performance
5. **Plan Generation**: AI generates contextually-aware plan
6. **Plan Storage**: Generated plan saved to database
7. **Feedback Collection**: User can rate and comment on the plan
8. **Feedback Storage**: Feedback saved for future reference

### Meal Plan Generation Flow

Similar to workout generation, but includes:
- Dietary restrictions and food preferences
- Recent calorie intake vs. goals
- Feedback on previous meal plans
- Liked/disliked foods from history

## Security Considerations

- ✅ All endpoints protected with authentication middleware
- ✅ User ID validation ensures users only access their own data
- ✅ Plan content is truncated to 15KB to prevent abuse
- ✅ Feedback submissions tied to authenticated user
- ✅ Input validation on ratings (1-5 range enforced)
- ⚠️ **TODO**: Implement rate limiting on AI generation endpoints
- ⚠️ **TODO**: Add request size limits for plan content

## Usage Example

### Frontend: AI Assistant with Personalization

```typescript
// User's profile is automatically used when generating plans
const handleWorkoutMode = async () => {
  const userData = {
    age: calculateAge(user.birthdate),
    weight: user.weight,
    height: user.height,
    gender: user.gender || 'Não informado',
    goal: user.goal || 'Não informado',
    fitnessLevel: user.fitnessLevel || 'Não informado',
    availableDays: user.availableDays || 'Não informado',
    equipment: user.equipment || 'Não informado',
    injuries: user.injuries || 'Nenhuma informada',
    preferences: user.workoutPreferences || 'Nenhuma informada',
    customRequest: currentMessage,
  };

  const response = await generateAIWorkoutPlan(userData);
  return response.data.workoutPlan;
};
```

### Backend: AI Service with Context

```javascript
// AI Service automatically fetches and includes activity summary
async function generateWorkoutPlan(userData, options = {}) {
  const { activitySummary } = options;
  
  // Build context from activity history
  let activityContext = '';
  if (activitySummary?.workouts) {
    activityContext = `
Histórico Recente (últimos 14 dias):
- Taxa de conclusão: ${activitySummary.workouts.summary.completionRate}%
- Feedback anterior: ${activitySummary.feedback.recent.map(f => 
  `${f.rating}/5 - ${f.feedbackText}`).join('; ')}

Ajustes: ${activitySummary.workouts.summary.completionRate > 80 
  ? 'Usuário consistente - pode aumentar dificuldade'
  : 'Manter intensidade atual'}
    `;
  }

  // Generate plan with full context
  const prompt = `
    Usuário: ${userData.name}
    Perfil: ${userData.goal}, nível ${userData.fitnessLevel}
    ${activityContext}
    
    Gere um plano personalizado...
  `;
  
  return await callOpenRouter(prompt, AI_MODELS.workout);
}
```

## Future Enhancements

- [ ] Progressive difficulty scaling based on long-term consistency
- [ ] Exercise recommendation engine based on feedback patterns
- [ ] Automatic plan adjustments after 3-4 weeks
- [ ] Integration with wearable devices for real-time adaptation
- [ ] Social comparison and group challenge features
- [ ] AI-powered form check using device camera
- [ ] Voice interaction with AI assistant
- [ ] Multi-language support for AI responses

## Testing

To test the new features:

1. **Update User Profile**:
   ```bash
   curl -X PUT http://localhost:5000/api/users/profile \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"fitnessLevel": "intermediate", "goal": "gain-muscle"}'
   ```

2. **Generate Workout Plan**:
   - Use AI Assistant in workout mode
   - Note the personalized recommendations

3. **Complete Some Workouts**:
   - Log workout sessions
   - Mark them as completed

4. **Provide Feedback**:
   - Rate the generated plan
   - Add text comments

5. **Generate Another Plan**:
   - Request a new workout plan
   - Observe how it adapts based on your history and feedback

## Troubleshooting

### Issue: AI doesn't seem to use my profile data

**Solution**: Ensure your profile is fully updated with the new fields. Check browser console for API errors.

### Issue: Activity summary is empty

**Solution**: You need at least one logged workout session or food diary entry. The system requires data to build a summary.

### Issue: Feedback not affecting future plans

**Solution**: Feedback is cumulative. You may need to provide feedback on 2-3 plans before clear patterns emerge in AI recommendations.

### Issue: Migration fails

**Solution**: Ensure PostgreSQL is running and accessible. Check that no other migrations are pending. Try:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## License

This feature is part of the StrengthSprint Companion project and follows the same license.
