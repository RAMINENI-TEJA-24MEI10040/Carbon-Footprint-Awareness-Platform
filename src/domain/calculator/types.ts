export type ActivityCategory = 'transportation' | 'energy' | 'food' | 'waste' | 'shopping' | 'water';

export interface BaseActivityLog {
  id: string;
  timestamp: string;
  category: ActivityCategory;
  type: string;
  value: number;
  unit: string;
  co2: number;
  notes?: string;
}

export interface TransportationActivity extends BaseActivityLog {
  category: 'transportation';
  type: 
    | 'petrol_car' 
    | 'diesel_car' 
    | 'ev' 
    | 'hybrid' 
    | 'motorcycle' 
    | 'bus' 
    | 'metro' 
    | 'local_train' 
    | 'high_speed_rail' 
    | 'taxi' 
    | 'ride_sharing' 
    | 'bicycle' 
    | 'walking' 
    | 'domestic_flight' 
    | 'international_flight';
}

export interface EnergyActivity extends BaseActivityLog {
  category: 'energy';
  type: 'electricity' | 'lpg' | 'natural_gas' | 'solar_offset' | 'diesel_generator';
}

export interface FoodActivity extends BaseActivityLog {
  category: 'food';
  type: 'vegan' | 'vegetarian' | 'pescatarian' | 'mixed_diet' | 'high_meat';
}

export interface WasteActivity extends BaseActivityLog {
  category: 'waste';
  type: 'recycling' | 'composting' | 'organic_waste' | 'plastic_waste' | 'electronic_waste';
}

export interface ShoppingActivity extends BaseActivityLog {
  category: 'shopping';
  type: 'clothing' | 'electronics' | 'furniture' | 'household_goods';
}

export interface WaterActivity extends BaseActivityLog {
  category: 'water';
  type: 'daily_consumption' | 'heated_water';
}

export type ActivityLog = 
  | TransportationActivity 
  | EnergyActivity 
  | FoodActivity 
  | WasteActivity 
  | ShoppingActivity 
  | WaterActivity;

export interface UserProfile {
  name: string;
  householdSize: number;
  country: string;
  gridFactorOverride?: number; // custom grid factor (kg CO2e per kWh)
}

export interface HistoricalAuditEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'bulk_import' | 'goal_achieved';
  details: string;
}
