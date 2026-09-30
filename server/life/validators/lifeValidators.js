const { z } = require("zod");

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm.");
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID.");
const optionalObjectId = z.union([objectId, z.literal(""), z.null()]).optional();

const schedule = z.object({
  type: z.enum(["daily", "weekdays", "weekends", "specific_weekdays", "every_n_days", "times_per_week", "days_of_month", "monthly", "specific_dates", "custom_interval"]).default("daily"),
  interval: z.coerce.number().int().min(1).max(365).optional(),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)).max(7).optional(),
  daysOfMonth: z.array(z.coerce.number().int().min(1).max(31)).max(31).optional(),
  dates: z.array(dateKey).max(366).optional(),
  timesPerWeek: z.coerce.number().int().min(1).max(7).optional(),
  times: z.array(time).max(24).optional(),
  window: z.object({ start: time, end: time.optional() }).nullable().optional(),
  startDate: dateKey.optional(),
  endDate: dateKey.nullable().optional(),
  pausedRanges: z.array(z.object({ start: dateKey, end: dateKey.nullable().optional() })).max(100).optional(),
}).passthrough();

const reminder = z.object({
  enabled: z.boolean().optional(),
  times: z.array(time).max(24).optional(),
  leadMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  followUpMinutes: z.coerce.number().int().min(1).max(1440).nullable().optional(),
  channels: z.array(z.enum(["in_app", "email", "web_push"])).max(3).optional(),
}).optional();

const habitCreate = z.object({
  name: z.string().trim().min(1).max(120),
  why: z.string().max(800).optional(),
  lifeAreaId: z.string().max(80).optional(),
  intent: z.enum(["build", "maintain", "reduce", "quit"]).optional(),
  measurementType: z.enum(["boolean", "quantity", "duration", "count", "limit", "avoid", "time", "custom"]).optional(),
  target: z.coerce.number().optional(),
  unit: z.string().max(40).optional(),
  preferredPeriod: z.enum(["anytime", "morning", "afternoon", "evening"]).optional(),
  schedule,
  reminder,
  gracePeriodMinutes: z.coerce.number().int().min(0).max(10080).optional(),
  difficulty: z.enum(["gentle", "moderate", "challenging"]).optional(),
  notes: z.string().max(2000).optional(),
  linkedGoal: optionalObjectId,
  replacementBehavior: z.string().max(400).optional(),
}).passthrough();

const event = z.object({
  status: z.enum(["completed", "partial", "skipped", "missed", "snoozed"]),
  scheduledDate: dateKey.optional(),
  scheduledTime: time.optional(),
  scheduledFor: z.string().datetime().optional(),
  occurredAt: z.string().datetime().optional(),
  quantity: z.coerce.number().nullable().optional(),
  unit: z.string().max(40).optional(),
  durationMinutes: z.coerce.number().min(0).nullable().optional(),
  note: z.string().max(2000).optional(),
  snoozedUntil: z.string().datetime().optional(),
  clientMutationId: z.string().min(8).max(240).optional(),
  backfilled: z.boolean().optional(),
}).strict();

const goal = z.object({
  title: z.string().trim().min(1).max(160),
  why: z.string().max(1000).optional(), lifeAreaId: z.string().max(80).optional(), startDate: dateKey.optional(), targetDate: dateKey.nullable().optional(),
  progressStrategy: z.enum(["manual", "milestones", "quantity", "linked_completions"]).optional(), manualProgress: z.coerce.number().min(0).max(100).optional(),
  currentValue: z.coerce.number().optional(), targetValue: z.coerce.number().nullable().optional(), unit: z.string().max(40).optional(),
  milestones: z.array(z.object({ title: z.string().min(1).max(160), targetDate: dateKey.nullable().optional(), completedAt: z.string().datetime().nullable().optional(), order: z.number().optional() })).max(100).optional(),
  linkedHabits: z.array(objectId).max(100).optional(), notes: z.string().max(3000).optional(),
  status: z.enum(["active", "paused", "completed", "abandoned", "archived"]).optional(),
}).passthrough();

const task = z.object({
  title: z.string().trim().min(1).max(160), localDate: dateKey.optional(), scheduledFor: z.string().datetime().nullable().optional(),
  period: z.enum(["all_day", "morning", "afternoon", "evening"]).optional(), priority: z.enum(["none", "low", "medium", "high"]).optional(),
  linkedGoal: optionalObjectId, lifeAreaId: z.string().max(80).optional(), durationEstimateMinutes: z.coerce.number().min(0).max(1440).nullable().optional(),
  notes: z.string().max(2000).optional(), status: z.enum(["active", "archived"]).optional(), clientMutationId: z.string().min(8).max(240).optional(),
}).passthrough();

const routine = z.object({
  name: z.string().trim().min(1).max(120), lifeAreaId: z.string().max(80).optional(),
  items: z.array(z.object({ title: z.string().min(1).max(120), order: z.number().optional(), linkedType: z.enum(["habit", "task", "routine_only"]).optional(), linkedId: optionalObjectId, optional: z.boolean().optional() })).max(100).optional(),
  schedule, reminder, status: z.enum(["active", "paused", "archived"]).optional(), effectiveDate: dateKey.optional(),
}).passthrough();

const health = z.object({
  type: z.enum(["water", "sleep", "mood", "workout", "symptom", "medication", "metric"]),
  localDate: dateKey.optional(), occurredAt: z.string().datetime().optional(), value: z.coerce.number().nullable().optional(), unit: z.string().max(40).optional(),
  startedAt: z.string().datetime().optional(), endedAt: z.string().datetime().optional(), durationMinutes: z.coerce.number().min(0).optional(),
  quality: z.coerce.number().int().min(1).max(5).nullable().optional(), mood: z.coerce.number().int().min(1).max(5).nullable().optional(), energy: z.coerce.number().int().min(1).max(5).nullable().optional(), stress: z.coerce.number().int().min(1).max(5).nullable().optional(),
  severity: z.coerce.number().int().min(1).max(10).nullable().optional(), label: z.string().max(160).optional(), doseText: z.string().max(160).optional(),
  workoutType: z.enum(["strength", "cardio", "mobility", "sport", "custom", ""]).optional(), exercises: z.array(z.any()).max(100).optional(), effort: z.coerce.number().min(1).max(10).nullable().optional(),
  note: z.string().max(3000).optional(), dedupeKey: z.string().max(240).optional(), source: z.object({ type: z.enum(["manual", "import", "integration", "system"]).optional(), provider: z.string().max(80).optional(), externalId: z.string().max(200).optional(), originalTimestamp: z.string().datetime().optional(), importedAt: z.string().datetime().optional() }).optional(),
}).passthrough();

const medication = z.object({
  name: z.string().trim().min(1).max(160), doseText: z.string().max(160).optional(), notes: z.string().max(2000).optional(),
  schedule, reminder, status: z.enum(["active", "paused", "archived"]).optional(), effectiveDate: dateKey.optional(),
}).passthrough();

const financeEntry = z.object({
  type: z.enum(["expense", "income", "savings_contribution"]).default("expense"), amount: z.coerce.number().min(0).optional(), amountMinor: z.coerce.number().int().min(0).optional(),
  currency: z.string().length(3).optional(), category: z.string().max(80).optional(), payee: z.string().max(160).optional(), occurredAt: z.string().datetime().optional(), localDate: dateKey.optional(),
  paymentMethod: z.string().max(80).optional(), note: z.string().max(2000).optional(), recurring: z.boolean().optional(), linkedFinancialGoal: optionalObjectId, dedupeKey: z.string().max(240).optional(),
}).refine((data) => data.amount !== undefined || data.amountMinor !== undefined, { message: "Amount is required." });

const financePlan = z.object({
  type: z.enum(["budget", "bill", "subscription", "savings_goal"]), name: z.string().trim().min(1).max(160), amount: z.coerce.number().min(0).optional(), amountMinor: z.coerce.number().int().min(0).optional(),
  currency: z.string().length(3).optional(), category: z.string().max(80).optional(), period: z.enum(["weekly", "monthly", "custom", "recurring"]).optional(),
  periodStart: dateKey.nullable().optional(), periodEnd: dateKey.nullable().optional(), schedule: schedule.nullable().optional(), reminder, currentAmountMinor: z.coerce.number().min(0).optional(), dueDate: dateKey.nullable().optional(), notes: z.string().max(2000).optional(),
}).refine((data) => data.amount !== undefined || data.amountMinor !== undefined, { message: "Amount is required." });

const journal = z.object({
  type: z.enum(["daily", "free", "weekly_review", "monthly_review"]).optional(), localDate: dateKey.optional(), title: z.string().max(180).optional(), body: z.string().trim().min(1).max(20000),
  promptResponses: z.array(z.object({ prompt: z.string().max(300), response: z.string().max(5000) })).max(20).optional(), occurredAt: z.string().datetime().optional(), pinnedToTimeline: z.boolean().optional(), dedupeKey: z.string().min(8).max(240).optional(),
}).strict();

const profile = z.object({
  timezone: z.string().max(80).optional(), locale: z.string().max(20).optional(), weekStart: z.enum(["monday", "sunday"]).optional(), unitSystem: z.enum(["metric", "imperial"]).optional(),
  waterUnit: z.enum(["ml", "l", "oz"]).optional(), weightUnit: z.enum(["kg", "lb"]).optional(), distanceUnit: z.enum(["km", "miles"]).optional(), currency: z.string().length(3).optional(),
  waterTargetMl: z.coerce.number().min(0).nullable().optional(), sleepTargetMinutes: z.coerce.number().min(0).max(1440).nullable().optional(), visibleModules: z.array(z.string()).max(20).optional(),
  aiInsightsEnabled: z.boolean().optional(), aiReview: z.object({ includeJournal: z.boolean().optional(), includeHealth: z.boolean().optional(), includeFinance: z.boolean().optional() }).optional(), notifications: z.any().optional(), vacationMode: z.any().optional(), priorities: z.array(z.string()).max(5).optional(),
}).passthrough();

const sourceSchema = z.object({
  type: z.enum(["manual", "phone", "wearable", "import", "integration", "system", "api", "derived"]).optional(),
  provider: z.string().max(80).optional(),
  externalId: z.string().max(200).optional(),
  originalTimestamp: z.string().datetime().optional(),
  importedAt: z.string().datetime().optional(),
}).optional();

const bodyEntry = z.object({
  localDate: dateKey.optional(),
  occurredAt: z.string().datetime().optional(),
  timezone: z.string().max(80).optional(),
  weight: z.coerce.number().min(1).max(500).nullable().optional(),
  weightUnit: z.enum(["kg", "lb"]).optional(),
  height: z.coerce.number().min(30).max(300).nullable().optional(),
  heightUnit: z.enum(["cm", "in"]).optional(),
  bmi: z.coerce.number().min(5).max(100).nullable().optional(),
  bodyFatPercentage: z.coerce.number().min(1).max(80).nullable().optional(),
  muscleMass: z.coerce.number().min(1).max(200).nullable().optional(),
  circumferences: z.object({
    waist: z.coerce.number().min(0).nullable().optional(),
    chest: z.coerce.number().min(0).nullable().optional(),
    hips: z.coerce.number().min(0).nullable().optional(),
    arms: z.coerce.number().min(0).nullable().optional(),
    thighs: z.coerce.number().min(0).nullable().optional(),
    neck: z.coerce.number().min(0).nullable().optional(),
    unit: z.enum(["cm", "in"]).optional(),
  }).optional(),
  vitals: z.object({
    systolicBp: z.coerce.number().min(40).max(300).nullable().optional(),
    diastolicBp: z.coerce.number().min(20).max(200).nullable().optional(),
    restingHeartRate: z.coerce.number().min(25).max(250).nullable().optional(),
    heartRate: z.coerce.number().min(25).max(250).nullable().optional(),
    spo2: z.coerce.number().min(50).max(100).nullable().optional(),
    temperature: z.coerce.number().min(30).max(45).nullable().optional(),
    temperatureUnit: z.enum(["celsius", "fahrenheit"]).optional(),
    bloodGlucose: z.coerce.number().min(10).max(1000).nullable().optional(),
    glucoseUnit: z.enum(["mg/dL", "mmol/L"]).optional(),
  }).optional(),
  note: z.string().max(2000).optional(),
  dedupeKey: z.string().max(240).optional(),
  source: sourceSchema,
}).passthrough();

const sleepSession = z.object({
  localDate: dateKey.optional(),
  sessionType: z.enum(["main", "nap"]).default("main"),
  sleepStart: z.string().datetime(),
  sleepEnd: z.string().datetime(),
  durationMinutes: z.coerce.number().min(0).optional(),
  quality: z.coerce.number().int().min(1).max(5).nullable().optional(),
  awakenings: z.coerce.number().int().min(0).optional(),
  refreshedRating: z.coerce.number().int().min(1).max(5).nullable().optional(),
  awakeMinutes: z.coerce.number().min(0).nullable().optional(),
  lightMinutes: z.coerce.number().min(0).nullable().optional(),
  deepMinutes: z.coerce.number().min(0).nullable().optional(),
  remMinutes: z.coerce.number().min(0).nullable().optional(),
  restingHeartRate: z.coerce.number().min(25).max(250).nullable().optional(),
  hrv: z.coerce.number().min(0).max(300).nullable().optional(),
  spo2Average: z.coerce.number().min(50).max(100).nullable().optional(),
  note: z.string().max(2000).optional(),
  dedupeKey: z.string().max(240).optional(),
  source: sourceSchema,
}).passthrough();

const workoutSession = z.object({
  localDate: dateKey.optional(),
  workoutType: z.enum(["walking", "running", "cycling", "strength", "hiit", "yoga", "swimming", "mobility", "sport", "custom"]).default("custom"),
  title: z.string().max(160).optional(),
  startedAt: z.string().datetime().nullable().optional(),
  endedAt: z.string().datetime().nullable().optional(),
  durationMinutes: z.coerce.number().min(0),
  distance: z.coerce.number().min(0).nullable().optional(),
  distanceUnit: z.enum(["km", "miles", "m", ""]).optional(),
  activeCalories: z.coerce.number().min(0).nullable().optional(),
  effort: z.coerce.number().int().min(1).max(10).nullable().optional(),
  exercises: z.array(z.object({
    name: z.string().trim().min(1).max(120),
    sets: z.array(z.object({
      setNumber: z.coerce.number().int().min(1).optional(),
      reps: z.coerce.number().int().min(0).nullable().optional(),
      weight: z.coerce.number().min(0).nullable().optional(),
      weightUnit: z.enum(["kg", "lb", "bodyweight", ""]).optional(),
      durationMinutes: z.coerce.number().min(0).nullable().optional(),
      distance: z.coerce.number().min(0).nullable().optional(),
      rpe: z.coerce.number().min(1).max(10).nullable().optional(),
      completed: z.boolean().optional(),
    })).max(50).optional(),
    notes: z.string().max(500).optional(),
  })).max(50).optional(),
  note: z.string().max(2000).optional(),
  dedupeKey: z.string().max(240).optional(),
  source: sourceSchema,
}).passthrough();

const nutritionEntry = z.object({
  localDate: dateKey.optional(),
  occurredAt: z.string().datetime().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  name: z.string().trim().min(1).max(160),
  servings: z.coerce.number().min(0.1).optional(),
  calories: z.coerce.number().min(0),
  protein: z.coerce.number().min(0).nullable().optional(),
  carbs: z.coerce.number().min(0).nullable().optional(),
  fat: z.coerce.number().min(0).nullable().optional(),
  fiber: z.coerce.number().min(0).nullable().optional(),
  sugar: z.coerce.number().min(0).nullable().optional(),
  sodium: z.coerce.number().min(0).nullable().optional(),
  note: z.string().max(1000).optional(),
  dedupeKey: z.string().max(240).optional(),
  source: sourceSchema,
}).passthrough();

const financeAccount = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(["bank", "credit_card", "cash", "wallet", "savings", "investment", "other"]).default("bank"),
  balance: z.coerce.number().optional(),
  balanceMinor: z.coerce.number().int().optional(),
  currency: z.string().length(3).optional(),
  institution: z.string().max(120).optional(),
  isArchived: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
}).passthrough();

const templateApply = z.object({ name: z.string().trim().min(1).max(120).optional(), time: time.optional(), scheduleType: schedule.shape.type.optional(), weekdays: z.array(z.coerce.number().int().min(0).max(6)).max(7).optional(), reminderEnabled: z.boolean().optional(), channels: z.array(z.enum(["in_app", "web_push"])).max(2).optional(), removedSteps: z.array(z.string().max(120)).max(30).optional(), steps: z.array(z.string().trim().min(1).max(120)).max(30).optional(), target: z.coerce.number().min(0).optional(), unit: z.string().max(40).optional() }).strict();
const pushSubscription = z.object({ endpoint: z.string().url().max(4096), expirationTime: z.union([z.number(), z.null()]).optional(), keys: z.object({ p256dh: z.string().min(1).max(1024), auth: z.string().min(1).max(512) }) }).strict();
const financeImportPreview = z.object({ csvText: z.string().min(1).max(1024 * 1024), mapping: z.record(z.string(), z.string()).optional() }).strict();
const aiReview = z.object({ days: z.coerce.number().int().min(7).max(366).optional(), period: z.enum(["ytd"]).optional(), start: dateKey.optional(), end: dateKey.optional(), question: z.string().trim().min(1).max(500).optional() }).passthrough();

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body || {});
  if (!result.success) return res.status(422).json({ success: false, code: "LIFE_VALIDATION", message: result.error.issues[0]?.message || "Please check the highlighted fields.", errors: result.error.issues });
  req.body = result.data;
  next();
};

module.exports = {
  aiReview,
  bodyEntry,
  bodyEntryUpdate: bodyEntry.partial(),
  event: event.extend({ routineSteps: z.array(z.object({ stepId: optionalObjectId, title: z.string().min(1).max(120), status: z.enum(["pending", "completed", "skipped"]) })).max(100).optional() }),
  financeAccount,
  financeAccountUpdate: financeAccount.partial(),
  financeEntry,
  financeImportPreview,
  financePlan,
  goal,
  habitCreate,
  habitUpdate: habitCreate.partial(),
  health,
  journal,
  medication,
  medicationUpdate: medication.partial(),
  nutritionEntry,
  nutritionEntryUpdate: nutritionEntry.partial(),
  objectId,
  profile,
  pushSubscription,
  routine,
  routineUpdate: routine.partial(),
  sleepSession,
  sleepSessionUpdate: sleepSession.partial(),
  task,
  taskUpdate: task.partial(),
  templateApply,
  validate,
  workoutSession,
  workoutSessionUpdate: workoutSession.partial(),
};
