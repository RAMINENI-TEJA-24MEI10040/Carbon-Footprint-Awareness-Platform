import { ActivityCategory } from './types';

export const EMISSION_FACTORS = {
  transportation: {
    petrol_car: 0.170,           // kg CO2e per km (DEFRA average)
    diesel_car: 0.171,           // kg CO2e per km
    ev: 0.047,                   // kg CO2e per km (assuming 18 kWh/100km at average grid mix)
    hybrid: 0.103,               // kg CO2e per km
    motorcycle: 0.113,           // kg CO2e per km
    bus: 0.096,                  // kg CO2e per passenger-km
    metro: 0.028,                // kg CO2e per passenger-km
    local_train: 0.035,          // kg CO2e per passenger-km
    high_speed_rail: 0.005,      // kg CO2e per passenger-km
    taxi: 0.200,                 // kg CO2e per km
    ride_sharing: 0.130,         // kg CO2e per passenger-km
    bicycle: 0.0,                // Zero direct emissions
    walking: 0.0,                // Zero direct emissions
    domestic_flight: 0.245,      // kg CO2e per passenger-km (short haul, RFI included)
    international_flight: 0.185, // kg CO2e per passenger-km (long haul, RFI included)
  },
  energy: {
    electricity: 0.380,          // kg CO2e per kWh (Global grid average default)
    lpg: 1.56,                   // kg CO2e per liter
    natural_gas: 0.185,          // kg CO2e per kWh (combustion)
    solar_offset: -0.380,        // kg CO2e per kWh (avoided grid grid emissions)
    diesel_generator: 2.68,      // kg CO2e per liter of diesel
  },
  food: {
    vegan: 0.60,                 // kg CO2e per meal
    vegetarian: 1.35,            // kg CO2e per meal
    pescatarian: 1.80,           // kg CO2e per meal
    mixed_diet: 2.50,            // kg CO2e per meal
    high_meat: 4.80,             // kg CO2e per meal
  },
  waste: {
    recycling: -0.35,            // kg CO2e offset per kg recycled
    composting: -0.15,           // kg CO2e offset per kg composted
    organic_waste: 0.50,         // kg CO2e per kg landfilled
    plastic_waste: 0.90,         // kg CO2e per kg landfilled
    electronic_waste: 11.20,     // kg CO2e per kg (manufacturing + disposal intensity)
  },
  shopping: {
    clothing: 15.0,              // kg CO2e per typical clothing piece
    electronics: 80.0,           // kg CO2e per electronic item (average laptop/phone lifecycle)
    furniture: 110.0,            // kg CO2e per piece of furniture
    household_goods: 8.0,        // kg CO2e per household item
  },
  water: {
    daily_consumption: 0.0003,   // kg CO2e per liter (water treatment and transport)
    heated_water: 0.012,         // kg CO2e per liter heated (assuming average water heater energy)
  }
} as const;

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  transportation: 'Transportation',
  energy: 'Home Energy',
  food: 'Food & Diet',
  waste: 'Waste & Recycling',
  shopping: 'Shopping & Goods',
  water: 'Water Usage'
};

export const UNIT_LABELS: Record<string, string> = {
  km: 'kilometers (km)',
  kwh: 'kilowatt-hours (kWh)',
  liters: 'liters (L)',
  meals: 'meals',
  kg: 'kilograms (kg)',
  items: 'items'
};

export const DEFAULT_UNITS: Record<ActivityCategory, Record<string, string>> = {
  transportation: {
    petrol_car: 'km',
    diesel_car: 'km',
    ev: 'km',
    hybrid: 'km',
    motorcycle: 'km',
    bus: 'km',
    metro: 'km',
    local_train: 'km',
    high_speed_rail: 'km',
    taxi: 'km',
    ride_sharing: 'km',
    bicycle: 'km',
    walking: 'km',
    domestic_flight: 'km',
    international_flight: 'km'
  },
  energy: {
    electricity: 'kWh',
    lpg: 'liters',
    natural_gas: 'kWh',
    solar_offset: 'kWh',
    diesel_generator: 'liters'
  },
  food: {
    vegan: 'meals',
    vegetarian: 'meals',
    pescatarian: 'meals',
    mixed_diet: 'meals',
    high_meat: 'meals'
  },
  waste: {
    recycling: 'kg',
    composting: 'kg',
    organic_waste: 'kg',
    plastic_waste: 'kg',
    electronic_waste: 'kg'
  },
  shopping: {
    clothing: 'items',
    electronics: 'items',
    furniture: 'items',
    household_goods: 'items'
  },
  water: {
    daily_consumption: 'liters',
    heated_water: 'liters'
  }
};
