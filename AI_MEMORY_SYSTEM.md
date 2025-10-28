# AI Memory and Feedback System

## Overview

The StrengthSprint AI agent now features a comprehensive memory and feedback system that enables adaptive, personalized fitness and nutrition recommendations. Unlike static AI that forgets previous interactions, this system maintains persistent memory of user conversations, plan feedback, and progress patterns to deliver evolving, context-aware suggestions.

## Problem Addressed

**Before:** The AI generated plans based solely on static profile data (age, weight, goals, preferences), resulting in:
- Repetitive recommendations that didn't evolve with user behavior
- No awareness of what worked or didn't work for the user
- No integration of workout logs, nutrition tracking, or user feedback
- Generic advice that failed to adapt to plateaus, injuries, or changing preferences

**After:** The AI now maintains cumulative context through persistent memory, enabling:
- Adaptive plans that learn from user feedback and progress
- Plateau detection and intensity adjustments based on adherence
- Personalized recommendations that reference past interactions
- Dynamic context injection with 70% recent / 30% historical weighting

---

## Architecture

### Database Schema

#### 1. **UserMemory**
Stores all AI conversations for context-aware responses.

```prisma
model UserMemory {
  id           Int      @id @default(autoincrement())
  userId       Int
  mode         String   // 'chat', 'workout', 'nutrition', 'health', 'document'
  userMessage  String   @db.Text
  aiResponse   String   @db.Text
  metadata     String?  @db.Text // JSON metadata (planType, planContext, focus)
  createdAt    DateTime @default(now())
}
```

**Example:**
```json
{
  "id": 123,
  "userId": 1,
  "mode": "workout",
  "userMessage": "Create a workout plan focusing on upper body strength",
  "aiResponse": "{...generated workout plan...}",
  "metadata": "{\"planContext\":\"ai-workout-1699912345\",\"planType\":\"workout\"}",
  "createdAt": "2024-11-05T12:00:00Z"
}
```

#### 2. **PlanFeedback**
Detailed user feedback on generated workout/nutrition plans.

```prisma
model PlanFeedback {
  id               Int      @id @default(autoincrement())
  userId           Int
  planType         String   // 'workout', 'nutrition'
  planReference    String?  // e.g., 'workoutPlan:123'
  rating           Int?     // 1-5
  difficultyRating Int?     // 1-5 (too easy to too hard)
  adherence        Int?     // percentage 0-100
  notes            String?  @db.Text
  improvements     String?  @db.Text // What user wants changed
  metadata         String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

**Example:**
```json
{
  "id": 456,
  "userId": 1,
  "planType": "workout",
  "planReference": "workoutPlan:789",
  "rating": 4,
  "difficultyRating": 3,
  "adherence": 85,
  "notes": "Great plan but squats hurt my knees",
  "improvements": "Replace squats with leg press",
  "createdAt": "2024-11-05T13:00:00Z"
}
```

#### 3. **ProgressLog**
Tracks user progress patterns, plateaus, and achievements.

```prisma
model ProgressLog {
  id            Int      @id @default(autoincrement())
  userId        Int
  date          DateTime @db.Date
  logType       String   // 'workout_completion', 'plateau_detected', 'goal_achieved', 'trend_improvement', 'trend_decline'
  category      String   // 'workout', 'nutrition', 'weight', 'strength', 'endurance'
  metric        String?  // e.g., 'bench_press_max', 'daily_calories'
  value         Float?
  previousValue Float?
  notes         String?  @db.Text
  createdAt     DateTime @default(now())
}
```

**Example:**
```json
{
  "id": 789,
  "userId": 1,
  "date": "2024-11-05",
  "logType": "trend_improvement",
  "category": "strength",
  "metric": "bench_press_max",
  "value": 185.0,
  "previousValue": 175.0,
  "notes": "Increased bench press by 10 lbs over 2 weeks",
  "createdAt": "2024-11-05T14:00:00Z"
}
```

---

## Core Functions

### 1. **getUserMemory(userId, mode, limit)**
Retrieves conversation history for context injection.

```javascript
const memory = await getUserMemory(1, 'chat', 5);
// Returns last 5 chat conversations for user 1
```

### 2. **saveUserMemory(userId, mode, userMessage, aiResponse, metadata)**
Persists new interactions to memory.

```javascript
await saveUserMemory(
  1,
  'chat',
  'How can I improve my deadlift?',
  'To improve your deadlift, focus on...',
  { planContext: 'chat-1699912345' }
);
```

### 3. **analyzeProgressPatterns(activitySummary)**
Detects patterns in workout adherence, nutrition tracking, and satisfaction.

```javascript
const analysis = analyzeProgressPatterns(activitySummary);
// Returns:
// {
//   insights: ['Excelente consistência nos treinos', 'Alta satisfação com planos anteriores'],
//   patterns: ['high_adherence', 'high_satisfaction'],
//   recommendations: []
// }
```

**Detection Rules:**
- **High adherence:** Completion rate ≥ 80%
- **Low adherence:** Completion rate < 50% → Recommend shorter/less frequent workouts
- **Low frequency:** < 3 sessions in 7 days → Suggest gradual increase
- **Irregular nutrition tracking:** < 5 tracked days in 14 → Simplify tracking
- **High satisfaction:** Average rating ≥ 4
- **Low satisfaction:** Average rating < 3 → Flag for plan adjustments

### 4. **buildAdaptiveContext({ userId, mode, planType, activitySummary })**
Aggregates memory, feedback, and progress into a structured prompt context.

**Weighting Strategy:**
- **Recent (70%)**: Last 5-10 interactions, most recent feedback
- **Historical (30%)**: Older data for pattern detection

**Output Structure:**
```
Contexto Histórico Personalizado:

Interações recentes:
- 3 de nov. 2024 Usuário: "Como melhorar deadlift?" | IA: "Para melhorar deadlift, foque em..."

Feedback do usuário:
- 2 de nov. 2024 Nota 4/5 (Dificuldade: 3/5) — "Ótimo plano mas agachamento machuca joelhos" — Solicitou: "Substituir agachamento por leg press"

Sinais de progresso observados:
- 1 de nov. 2024 • bench press max: 185.0 (+10.0 vs período anterior). Aumentou supino em 10 lbs...

Insights recentes:
- Excelente consistência nos treinos
- Alta satisfação com planos anteriores
```

### 5. **Enhanced AI Functions**

#### generateWorkoutPlan(userData, options)
Now includes:
- Historical workout feedback to avoid exercises with negative reviews
- Adherence-based intensity adjustments (high adherence → increase difficulty)
- Plateau detection and recovery protocols
- Coaching notes explaining adaptations

**New Prompt Instructions:**
```javascript
Regras para o plano:
- Use o histórico para detectar platôs: se a adesão caiu, reduza a carga ou simplifique exercícios.
- Reforce exercícios com boa adesão e variações que respondam ao feedback positivo.
- Se houver queixas de dor ou sobrecarga, ajuste o volume e inclua mobilidade ou recuperação ativa.
- Mostre progressão clara (ex.: cargas menores para recomeço ou incrementos graduais).
```

#### generateMealPlan(userData, nutritionalGoals, options)
Now includes:
- Food preference/aversion tracking from feedback
- Caloric adjustment based on actual vs. target intake
- Simplified meal suggestions for irregular trackers
- Coaching notes explaining nutritional adaptations

#### answerQuestion(question, userData, context, options)
Now includes:
- Last 5-10 chat conversations for continuity
- Progress insights to inform recommendations
- Personalized safety warnings based on injury history

---

## API Endpoints

### Memory Management

#### `GET /api/ai/memory?mode=chat&limit=10`
Retrieve conversation history.

**Query Parameters:**
- `mode` (optional): Filter by mode ('chat', 'workout', 'nutrition', 'health', 'document')
- `limit` (optional): Number of entries (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "memory": [
    {
      "id": 123,
      "mode": "chat",
      "userMessage": "How to improve deadlift?",
      "aiResponse": "To improve deadlift...",
      "metadata": "{\"planContext\":\"chat-1699912345\"}",
      "createdAt": "2024-11-05T12:00:00Z"
    }
  ]
}
```

---

### Plan Feedback

#### `POST /api/ai/plan-feedback`
Submit detailed feedback on a workout/nutrition plan.

**Request Body:**
```json
{
  "planType": "workout",
  "planReference": "workoutPlan:789",
  "rating": 4,
  "difficultyRating": 3,
  "adherence": 85,
  "notes": "Great plan but squats hurt my knees",
  "improvements": "Replace squats with leg press",
  "metadata": { "exerciseConcerns": ["squat"] }
}
```

**Response:**
```json
{
  "success": true,
  "feedback": {
    "id": 456,
    "planType": "workout",
    "rating": 4,
    "difficultyRating": 3,
    "adherence": 85,
    "createdAt": "2024-11-05T13:00:00Z"
  }
}
```

#### `GET /api/ai/plan-feedback?planType=workout&limit=10`
Retrieve user's plan feedback history.

**Query Parameters:**
- `planType` (optional): Filter by 'workout' or 'nutrition'
- `limit` (optional): Number of entries (default: 10, max: 50)

---

### Progress Logging

#### `POST /api/ai/progress-log`
Log a progress event (plateau, achievement, trend).

**Request Body:**
```json
{
  "date": "2024-11-05",
  "logType": "trend_improvement",
  "category": "strength",
  "metric": "bench_press_max",
  "value": 185.0,
  "previousValue": 175.0,
  "notes": "Increased bench press by 10 lbs over 2 weeks"
}
```

**Response:**
```json
{
  "success": true,
  "progressLog": {
    "id": 789,
    "userId": 1,
    "date": "2024-11-05",
    "logType": "trend_improvement",
    "category": "strength",
    "metric": "bench_press_max",
    "value": 185.0,
    "previousValue": 175.0,
    "createdAt": "2024-11-05T14:00:00Z"
  }
}
```

#### `GET /api/ai/progress-log?category=strength&limit=20`
Retrieve progress logs.

**Query Parameters:**
- `category` (optional): Filter by category ('workout', 'nutrition', 'weight', 'strength', 'endurance')
- `logType` (optional): Filter by log type
- `limit` (optional): Number of entries (default: 20, max: 100)

---

## Security & Privacy

### Sensitive Data Sanitization
All memory entries are sanitized before storage:

```javascript
const SENSITIVE_PATTERNS = [/senha/gi, /password/gi, /token/gi, /auth[_-]?code/gi];

const sanitizeContextSnippet = (text, maxLength = 220) => {
  const truncated = text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`;
  return SENSITIVE_PATTERNS.reduce((value, pattern) => value.replace(pattern, '[dado confidencial]'), truncated);
};
```

### Context Length Limits
- **UserMessage/AIResponse**: Max 5000 characters per entry
- **Feedback notes**: Max 500 characters
- **Context snippets in prompts**: Truncated to 160-220 chars with "..." suffix

### Data Retention
- All memory is user-scoped with `onDelete: Cascade`
- Deleting a user automatically purges all memory, feedback, and progress logs

---

## Usage Examples

### Scenario 1: User Complains About Knee Pain

**Step 1: User submits workout feedback**
```javascript
POST /api/ai/plan-feedback
{
  "planType": "workout",
  "planReference": "workoutPlan:789",
  "rating": 3,
  "notes": "Squats caused knee pain",
  "improvements": "Need lower-impact leg exercises"
}
```

**Step 2: Next workout plan generation**
```javascript
const adaptiveContext = await buildAdaptiveContext({
  userId: 1,
  mode: 'workout',
  planType: 'workout',
  activitySummary,
});
```

**Injected Context:**
```
Feedback do usuário:
- 4 de nov. 2024 Nota 3/5 — "Squats caused knee pain" — Solicitou: "Need lower-impact leg exercises"
```

**AI Response:**
- Removes squats from new plan
- Suggests leg press, lunges, or step-ups as alternatives
- Adds mobility/stretching for knee health

---

### Scenario 2: Detecting Low Adherence

**Observed Pattern:**
- User created 5 workout plans but only completed 2 sessions (40% adherence)

**Analysis:**
```javascript
const analysis = analyzeProgressPatterns(activitySummary);
// Returns:
// {
//   insights: ['Baixa adesão aos treinos'],
//   patterns: ['low_adherence'],
//   recommendations: ['Considere treinos mais curtos ou menos frequentes para melhorar a adesão']
// }
```

**Injected Context:**
```
Insights recentes:
- Baixa adesão aos treinos

Ajustes sugeridos:
- Considere treinos mais curtos ou menos frequentes para melhorar a adesão
```

**AI Response:**
- Reduces workout frequency from 5x/week to 3x/week
- Shortens sessions from 60 min to 45 min
- Simplifies exercises to reduce intimidation

---

### Scenario 3: Nutrition Adjustment Based on Caloric Deficit

**Observed Pattern:**
- User's target: 2500 kcal/day
- Actual average: 2100 kcal/day (400 kcal deficit)

**Analysis:**
```javascript
const { nutrition } = activitySummary;
// nutrition.summary.averageCalories = 2100
```

**Injected Context:**
```
Histórico Nutricional Recente:
- Calorias médias: 2100 kcal

Ajustes desejados:
- Se as calorias médias reais estão abaixo da meta, aumente ligeiramente o aporte calórico.
```

**AI Response:**
- Increases portion sizes for carbs/fats
- Adds a high-calorie snack (e.g., protein shake, nuts)
- Explains the adjustment in `coachingNotes`: "Aumentei ligeiramente as porções para alinhar com sua meta de 2500 kcal/dia."

---

## Testing

### Unit Tests

Located in `/backend/test/ai.test.js`:

```javascript
describe('AI Memory System', () => {
  it('should save and retrieve user memory', async () => {
    const memory = await saveUserMemory(1, 'chat', 'test question', 'test answer');
    expect(memory).toHaveProperty('id');
    
    const retrieved = await getUserMemory(1, 'chat', 10);
    expect(retrieved).toContainEqual(expect.objectContaining({
      userMessage: 'test question',
      aiResponse: 'test answer'
    }));
  });

  it('should analyze progress patterns', () => {
    const activitySummary = {
      workouts: {
        summary: { completionRate: 85, totalSessions: 10 }
      },
      nutrition: {
        summary: { trackedDays: 10, averageCalories: 2200 }
      },
      feedback: {
        averageRating: 4.5,
        recent: []
      }
    };
    
    const analysis = analyzeProgressPatterns(activitySummary);
    expect(analysis.insights).toContain('Excelente consistência nos treinos');
    expect(analysis.patterns).toContain('high_adherence');
  });
});
```

### Integration Tests

Test full flow:
1. User creates workout plan
2. AI incorporates empty history (first generation)
3. User submits feedback (rating 2, notes "too difficult")
4. User creates new workout plan
5. AI incorporates feedback and reduces intensity

---

## Migration Guide

### Database Migration

Run the migration to add new tables:

```bash
cd /home/engine/project/backend
npx prisma db push
npx prisma generate
```

This creates:
- `user_memory` table
- `plan_feedback` table
- `progress_logs` table

---

## Performance Considerations

### Query Optimization
- All tables indexed on `(userId, createdAt)` for fast recent retrieval
- Limits enforced: max 10 memory entries, 6 feedback entries, 8 progress logs per prompt
- Truncation at prompt-building stage to avoid token overflow

### Caching Strategy
- Consider caching `buildAdaptiveContext` output for 1-2 minutes per user
- Invalidate cache on new feedback/memory entries

---

## Future Enhancements

1. **Sentiment Analysis**: Automatically detect frustration/satisfaction in feedback text
2. **Clustering**: Group users by adherence patterns for cohort-based insights
3. **Predictive Modeling**: Forecast likelihood of plan abandonment and intervene proactively
4. **Multi-Modal Memory**: Store image uploads (meal photos, form videos) with OCR/CV analysis
5. **Memory Summarization**: Use LLM to condense 100+ interactions into concise summaries
6. **Collaborative Filtering**: "Users like you also benefited from..." recommendations

---

## Support

For issues or questions about the AI Memory System, contact the development team or open a GitHub issue.

**Key Files:**
- `/backend/services/aiService.js` - Core AI logic
- `/backend/routes/ai.js` - API endpoints
- `/backend/prisma/schema.prisma` - Database schema
- `/backend/services/activitySummaryService.js` - Activity aggregation

---

**Version:** 1.0.0  
**Last Updated:** November 5, 2024
