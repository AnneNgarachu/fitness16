export const GYM = {
  name: 'Fitness 16',
  tagline: 'No Excuses. Just Work.',
  locations: [
    { id: 'juja', name: 'Juja', address: 'Juja South Road', phone: '+254 793 466 828' },
    { id: 'ruaka', name: 'Ruaka', address: 'Ruaka Town', phone: '+254 726 050 613' },
  ],
  plans: [
    { id: 'day', name: 'Day Pass', price: 500, days: 1 },
    { id: 'week', name: '1 Week', price: 2000, days: 7 },
    { id: 'month', name: '1 Month', price: 5500, days: 30, popular: true },
    { id: 'quarterly', name: 'Quarterly', price: 15000, days: 90, save: '10%' },
    { id: 'semi_annual', name: 'Semi-Annual', price: 30000, days: 180, save: '15%' },
    { id: 'annual', name: 'Annual', price: 54000, days: 365, save: '20%' },
  ],
  quotes: [
    "No excuses. No shortcuts. Just work.",
    "Your body can do it. It's your mind you need to convince.",
    "The pain you feel today is the strength you feel tomorrow.",
    "Champions train. Losers complain.",
  ],
} as const

export const EQUIPMENT = [
  { category: 'Legs & Glutes', items: ['Leg Press', 'Hack Squat', 'Leg Extension', 'Leg Curl', 'Hip Thrust'] },
  { category: 'Chest', items: ['Chest Press', 'Incline Press', 'Cable Crossover'] },
  { category: 'Back', items: ['Lat Pulldown', 'Seated Row', 'Cable Row'] },
  { category: 'Shoulders & Arms', items: ['Shoulder Press', 'Bicep Curl', 'Tricep Extension'] },
  { category: 'Cardio', items: ['Treadmill', 'Cycling', 'Elliptical'] },
]