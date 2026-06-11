// src/config/plans.js

export const PLAN_TYPES = {
  regular: {
    label: 'Regular',
    price: 80,
    chapatis: 5,
    description: '5 Chapatis + Rice + Sabzi + Dal',
  },
  trial: {
    label: 'Trial',
    price: 90,
    chapatis: 5,
    description: 'One-time tiffin, same as Regular',
  },
  customize: {
    label: 'Customize',
    price: 100,
    chapatis: 5,
    description: 'Custom menu / Sunday Special',
  },
  premium: {
    label: 'Premium',
    price: 150,
    chapatis: 6,
    description: '6 Butter Chapatis + Rice + 2 Sabzi + Dal + Salad',
  },
};

// CSS classes for plan badges — used everywhere a plan tag is shown
export const PLAN_BADGE = {
  regular:   'bg-red-600 text-white',
  trial:     'bg-amber-500 text-white',
  customize: 'bg-purple-600 text-white',
  premium:   'bg-yellow-500 text-white',
};

// Whether a plan type is a one-time order (true) or ongoing subscription (false)
export const PLAN_IS_ONETIME = {
  regular: false,
  trial: true,
  customize: false,
  premium: false,
};
