# Nutrition AI Generation and Calendar Prompt Feature

## Overview
This feature implements comprehensive AI-powered nutrition generation capabilities with calendar scheduling integration. Users can generate single meals, daily meal plans, or complete multi-week nutrition programs, then schedule them directly to their account calendar.

## Implementation Summary

### Backend Changes

#### 1. AI Service Enhancements (`backend/services/aiService.js`)

**New Functions Added:**

1. **`generateSingleMeal(userData, nutritionalGoals, options)`**
   - Generates a single personalized meal based on user profile
   - Parameters:
     - `userData`: User profile information
     - `nutritionalGoals`: User's nutrition targets
     - `options`: { mealType, activitySummary, userId, planContext, requestSummary }
   - Returns: JSON with meal details, items, and coaching notes
   - Use case: Quick meal suggestions for specific times of day

2. **`generateNutritionProgram(userData, nutritionalGoals, options)`**
   - Generates complete multi-week nutrition programs
   - Parameters:
     - `userData`: User profile information
     - `nutritionalGoals`: User's nutrition targets
     - `options`: { programType, duration, activitySummary, userId, planContext, requestSummary }
   - Program types supported:
     - `cutting`: Fat loss while maintaining muscle
     - `bulking`: Muscle gain
     - `maintenance`: Weight maintenance
     - `recomp`: Body recomposition
   - Returns: JSON with program phases, weekly goals, and guidelines
   - Use case: Long-term nutrition planning with periodization

**Enhanced Existing Function:**
- `generateMealPlan()` - Already supported daily meal plan generation

#### 2. New API Routes (`backend/routes/ai.js`)

**Endpoints Added:**

1. **`POST /api/ai/nutrition/single-meal`**
   - Request body:
     ```json
     {
       "mealType": "almoço",
       "customRequest": "optional user request",
       "nutritionalGoals": { ... }
     }
     ```
   - Response:
     ```json
     {
       "success": true,
       "meal": { ... },
       "mealSummary": { calories, protein, carbs, fat },
       "coachingNotes": "...",
       "planContext": "ai-single-meal-..."
     }
     ```

2. **`POST /api/ai/nutrition/program`**
   - Request body:
     ```json
     {
       "programType": "cutting",
       "duration": 8,
       "customRequest": "optional user request",
       "nutritionalGoals": { ... }
     }
     ```
   - Response:
     ```json
     {
       "success": true,
       "program": {
         "program": { ... },
         "phases": [ ... ],
         "generalGuidelines": { ... }
       },
       "planContext": "ai-nutrition-program-..."
     }
     ```

### Frontend Changes

#### 1. New Component: `NutritionAIGenerator.tsx`

**Location:** `src/components/nutrition/NutritionAIGenerator.tsx`

**Features:**
- Radio button interface for selecting generation type:
  - Single Meal
  - Daily Plan
  - Nutrition Program
- Context-specific options:
  - Meal type selector for single meals
  - Program type and duration for nutrition programs
- Custom request textarea for personalized instructions
- AI generation with loading states
- Preview of generated content
- Calendar scheduling modal
- Direct integration with meal plan persistence

**Component Structure:**
```typescript
- State management for generation type, options, and generated data
- handleGenerate(): Calls appropriate API based on generation type
- handleAddToCalendar(): Opens calendar modal for scheduling
- handleConfirmSchedule(): Persists scheduled meal plan to database
- UI sections:
  - Generation type selection (radio buttons)
  - Context-specific options (conditional rendering)
  - Custom request input
  - Generate button with loading state
  - Generated content preview
  - Calendar scheduling modal
```

#### 2. Integration with MealPlanning Page

**Location:** `src/pages/nutrition/MealPlanning.tsx`

**Changes:**
- Added new tab "Gerador IA" (AI Generator)
- Imported and rendered `NutritionAIGenerator` component
- Updated mobile dropdown and desktop tabs to include new option
- Tab displays with Sparkles icon for visual distinction

#### 3. API Service Updates

**Location:** `src/services/api.ts`

**New Services:**
```typescript
generateSingleMeal: (data: any) => api.post('/ai/nutrition/single-meal', data)
generateNutritionProgram: (data: any) => api.post('/ai/nutrition/program', data)
```

## User Flow

### Generating Single Meal
1. User navigates to Meal Planning > Gerador IA tab
2. Selects "Refeição Única" (Single Meal)
3. Chooses meal type (breakfast, lunch, dinner, snack, supper)
4. Optionally adds custom request
5. Clicks "Gerar com IA"
6. AI generates personalized meal with items and macros
7. User reviews content in preview
8. Clicks "Adicionar ao Calendário"
9. Selects date in calendar modal
10. Confirms scheduling
11. Meal plan is saved to account calendar

### Generating Daily Plan
1. User selects "Plano Diário"
2. Optionally adds custom request
3. AI generates complete day with multiple meals
4. User schedules to calendar

### Generating Nutrition Program
1. User selects "Programa Nutricional"
2. Chooses program type (cutting, bulking, maintenance, recomp)
3. Sets duration in weeks (4-24)
4. Optionally adds custom request
5. AI generates phased program with guidelines
6. User reviews program structure
7. (Note: Programs provide guidelines, not schedulable meal plans)

## Technical Details

### AI Prompts
All generation functions use structured prompts that include:
- User profile (age, weight, height, gender, goals)
- Nutrition goals (calories, protein, carbs, fat)
- Dietary restrictions and preferences
- Activity summary and feedback history
- Custom user requests
- Adaptive context from previous interactions

### Response Formats
All AI functions return structured JSON responses:
- Single Meal: meal object with items array
- Daily Plan: meals array with multiple meal objects
- Program: program metadata with phases array

### Calendar Integration
- Uses shadcn/ui Calendar component
- Date selection with past date restriction
- Modal dialog for user-friendly scheduling
- Direct persistence via existing `addMealPlan` context function
- Automatic data transformation from AI format to meal plan schema

### Error Handling
- API-level error responses with appropriate HTTP status codes
- Frontend toast notifications for user feedback
- Loading states during AI generation
- Validation of generated content before scheduling

## Database Impact
- No schema changes required
- Uses existing MealPlan, Meal, MealFood, and Food models
- AI responses stored in raw_response field for reference
- User memory saved for adaptive learning

## Benefits
1. **Flexibility**: Three generation types for different use cases
2. **Personalization**: AI considers user profile, history, and preferences
3. **Convenience**: Direct calendar scheduling from generation interface
4. **Context Awareness**: Adaptive prompts based on user activity and feedback
5. **Progressive Enhancement**: Users can generate quick meals or comprehensive programs
6. **User Control**: Preview before scheduling, custom request support

## Future Enhancements
- Batch scheduling for weekly plans
- Recurring meal plans
- Meal plan templates based on program phases
- Export program guidelines as PDF
- Integration with food diary for automatic tracking
- Shopping list generation from scheduled meals
