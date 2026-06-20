import { ActivityLog, UserProfile, ActivityCategory } from '../calculator/types';
import { EMISSION_FACTORS } from '../calculator/constants';

export interface Recommendation {
  id: string;
  title: string;
  category: ActivityCategory;
  co2ReductionAnnual: number; // kg CO2e
  monthlySavings: number; // USD
  difficulty: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  confidence: number; // 0 - 100
  reasoning: string;
  priority: number;
  estimatedTime: string;
  actionableSteps: string[];
}

export class RecommendationEngine {
  /**
   * Generates highly personalized, data-driven recommendations by scanning historical logs.
   * Calculations are grounded in the user's actual log volume.
   */
  static generateRecommendations(logs: ActivityLog[], profile: UserProfile): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // 1. Group logs by category and type to evaluate user habits
    const categoryTotals: Record<ActivityCategory, number> = {
      transportation: 0,
      energy: 0,
      food: 0,
      waste: 0,
      shopping: 0,
      water: 0
    };
    
    const typeTotals: Record<string, number> = {};
    
    // Find min and max timestamps to calculate log span
    let minTime = Date.now();
    let maxTime = Date.now();
    if (logs.length > 0) {
      minTime = Math.min(...logs.map(l => new Date(l.timestamp).getTime()));
      maxTime = Math.max(...logs.map(l => new Date(l.timestamp).getTime()));
    }
    
    // Calculate logging time span in weeks (minimum 1 week to avoid division by zero)
    const timeSpanWeeks = Math.max(1, (maxTime - minTime) / (1000 * 60 * 60 * 24 * 7));
    
    logs.forEach(log => {
      categoryTotals[log.category] += log.co2;
      typeTotals[log.type] = (typeTotals[log.type] || 0) + log.value;
    });

    const weeklyPetrolCarKm = (typeTotals['petrol_car'] || 0) / timeSpanWeeks;
    const weeklyDieselCarKm = (typeTotals['diesel_car'] || 0) / timeSpanWeeks;
    const monthlyElectricityKwh = ((typeTotals['electricity'] || 0) / timeSpanWeeks) * 4.33; // average weeks in month
    const weeklyHighMeatMeals = (typeTotals['high_meat'] || 0) / timeSpanWeeks;
    const weeklyMixedDietMeals = (typeTotals['mixed_diet'] || 0) / timeSpanWeeks;
    const weeklyPlasticWasteKg = (typeTotals['plastic_waste'] || 0) / timeSpanWeeks;
    const weeklyOrganicWasteKg = (typeTotals['organic_waste'] || 0) / timeSpanWeeks;


    // RECOMMENDATION 1: Transportation Shift (Car to Public Transit/Active)
    const activeCarWeeklyKm = weeklyPetrolCarKm + weeklyDieselCarKm;
    if (activeCarWeeklyKm > 30) {
      const petrolFactor = EMISSION_FACTORS.transportation.petrol_car;
      const busFactor = EMISSION_FACTORS.transportation.bus;
      // Assume switching 30% of weekly car travel to bus/metro
      const kmSwitched = activeCarWeeklyKm * 0.3;
      const co2ReductionAnnual = kmSwitched * (petrolFactor - busFactor) * 52;
      const fuelCostPerKm = 0.12; // assumed $0.12 savings per km (gasoline vs public transit ticket)
      const monthlySavings = kmSwitched * fuelCostPerKm * 4.33;

      recommendations.push({
        id: 'rec_transport_public_transit',
        title: 'Switch 30% of driving to public transit',
        category: 'transportation',
        co2ReductionAnnual: Math.round(co2ReductionAnnual),
        monthlySavings: Math.round(monthlySavings),
        difficulty: 'medium',
        impact: co2ReductionAnnual > 300 ? 'high' : 'medium',
        confidence: 90,
        reasoning: `Based on your logging, you drive approximately ${Math.round(activeCarWeeklyKm)} km per week. Replacing 30% of those trips with bus or metro commutes reduces emissions from ${petrolFactor} to ${busFactor} kg CO2e/km.`,
        priority: 1,
        estimatedTime: '1 week',
        actionableSteps: [
          'Identify 2 regular commutes or shopping trips that overlap with transit routes.',
          'Install local transit mapping apps and purchase a rechargeable travel card.',
          'Commit to a "Transit Tuesday" or "Transit Thursday" to establish the routine.'
        ]
      });

      // RECOMMENDATION 2: EV Transition (High-Impact Long-Term)
      if (activeCarWeeklyKm > 100) {
        const evFactor = EMISSION_FACTORS.transportation.ev;
        const currentCarFactor = weeklyPetrolCarKm > weeklyDieselCarKm ? petrolFactor : EMISSION_FACTORS.transportation.diesel_car;
        const co2ReductionAnnualEV = activeCarWeeklyKm * (currentCarFactor - evFactor) * 52;
        const fuelSavingsEV = activeCarWeeklyKm * (fuelCostPerKm - 0.04) * 4.33; // EV is cheaper to charge

        recommendations.push({
          id: 'rec_transport_ev',
          title: 'Transition to an Electric Vehicle (EV)',
          category: 'transportation',
          co2ReductionAnnual: Math.round(co2ReductionAnnualEV),
          monthlySavings: Math.round(fuelSavingsEV),
          difficulty: 'high',
          impact: 'high',
          confidence: 95,
          reasoning: `Your high mileage of ${Math.round(activeCarWeeklyKm)} km/week makes an electric vehicle highly effective. An EV cuts driving emissions by ~70% compared to fossil fuel vehicles.`,
          priority: 4,
          estimatedTime: '2-3 months',
          actionableSteps: [
            'Research local EV dealer inventory and government tax credits or cash incentives.',
            'Estimate home charging costs relative to public charging rates.',
            'Test drive an EV model that fits your typical weekly mileage profile.'
          ]
        });
      }
    } else {
      // Default lower mileage recommendation
      recommendations.push({
        id: 'rec_transport_walking',
        title: 'Walk or bike for short trips under 3 km',
        category: 'transportation',
        co2ReductionAnnual: 85,
        monthlySavings: 15,
        difficulty: 'low',
        impact: 'low',
        confidence: 85,
        reasoning: 'Driving short distances uses fuel inefficiently. Replacing trips under 3 km with walking or cycling eliminates tailpipe emissions entirely while improving physical health.',
        priority: 2,
        estimatedTime: 'Immediate',
        actionableSteps: [
          'Keep shopping bags near your bicycle or entryway.',
          'Combine errands so you can walk to multiple points in one outing.',
          'Use walking trips to meet your daily steps goal.'
        ]
      });
    }

    // RECOMMENDATION 3: Home Electricity Reduction (Solar or efficiency)
    if (monthlyElectricityKwh > 100) {
      const co2ReductionAnnualElectricity = monthlyElectricityKwh * 0.15 * 12 * EMISSION_FACTORS.energy.electricity;
      const averageCostPerKwh = 0.16; // $0.16 per kWh
      const monthlySavingsElectricity = monthlyElectricityKwh * 0.15 * averageCostPerKwh;

      recommendations.push({
        id: 'rec_energy_efficiency',
        title: 'Reduce electricity usage by 15% through smart adjustments',
        category: 'energy',
        co2ReductionAnnual: Math.round(co2ReductionAnnualElectricity),
        monthlySavings: Math.round(monthlySavingsElectricity),
        difficulty: 'low',
        impact: co2ReductionAnnualElectricity > 200 ? 'high' : 'medium',
        confidence: 90,
        reasoning: `With an estimated monthly consumption of ${Math.round(monthlyElectricityKwh)} kWh, implementing simple energy efficiency adjustments yields significant compound savings.`,
        priority: 1,
        estimatedTime: '3 days',
        actionableSteps: [
          'Switch old incandescent bulbs to LEDs, saving up to 80% on lighting energy.',
          'Set thermostats 1°C cooler in winter or 1°C warmer in summer.',
          'Unplug standby appliances ("phantom loads") or connect them to smart power strips.'
        ]
      });

      // Solar option
      if (profile.householdSize >= 3) {
        // High household size implies a house suitable for solar
        const solarGeneratedMonthly = 300; // estimated standard solar panel offset
        const co2ReductionAnnualSolar = solarGeneratedMonthly * Math.abs(EMISSION_FACTORS.energy.electricity) * 12;
        const monthlySavingsSolar = solarGeneratedMonthly * averageCostPerKwh;

        recommendations.push({
          id: 'rec_energy_solar',
          title: 'Install rooftop solar panels',
          category: 'energy',
          co2ReductionAnnual: Math.round(co2ReductionAnnualSolar),
          monthlySavings: Math.round(monthlySavingsSolar),
          difficulty: 'high',
          impact: 'high',
          confidence: 88,
          reasoning: `Based on your household size of ${profile.householdSize}, rooftop solar can offset substantial grid consumption by producing clean local energy.`,
          priority: 5,
          estimatedTime: '1-2 months',
          actionableSteps: [
            'Check structural shade from trees or neighbouring properties on your roof.',
            'Consult solar installation contractors for estimates and payback period charts.',
            'Review net metering credits with your municipal electric provider.'
          ]
        });
      }
    } else {
      recommendations.push({
        id: 'rec_energy_default',
        title: 'Adopt standby power saving habits',
        category: 'energy',
        co2ReductionAnnual: 55,
        monthlySavings: 8,
        difficulty: 'low',
        impact: 'low',
        confidence: 95,
        reasoning: 'A large portion of household energy is consumed by appliances in standby mode. Turning appliances fully off at sockets is an instant win.',
        priority: 3,
        estimatedTime: 'Instant',
        actionableSteps: [
          'Turn off routers, game consoles, and TVs when going to bed or traveling.',
          'Set computers to auto-sleep after 10 minutes of inactivity.'
        ]
      });
    }

    // RECOMMENDATION 4: Diet adjustment (High-meat to Vegetarian/Vegan)
    const meatMealsWeekly = weeklyHighMeatMeals + weeklyMixedDietMeals;
    if (meatMealsWeekly > 3) {
      const currentMealsCount = meatMealsWeekly;
      // Swap 3 meals a week to vegetarian
      const mealsToSwap = Math.min(3, currentMealsCount);
      const meatFactor = weeklyHighMeatMeals > weeklyMixedDietMeals ? EMISSION_FACTORS.food.high_meat : EMISSION_FACTORS.food.mixed_diet;
      const vegFactor = EMISSION_FACTORS.food.vegetarian;
      const co2ReductionAnnualFood = mealsToSwap * (meatFactor - vegFactor) * 52;
      const monthlySavingsFood = mealsToSwap * 4.0 * 4.33; // assume vegetarian meal saves $4 on ingredients

      recommendations.push({
        id: 'rec_food_diet_swap',
        title: `Replace ${mealsToSwap} meat meals per week with vegetarian options`,
        category: 'food',
        co2ReductionAnnual: Math.round(co2ReductionAnnualFood),
        monthlySavings: Math.round(monthlySavingsFood),
        difficulty: 'low',
        impact: co2ReductionAnnualFood > 150 ? 'high' : 'medium',
        confidence: 92,
        reasoning: `Meat production (especially beef and pork) is highly carbon-intensive. Swapping just ${mealsToSwap} meals a week to vegetarian reduces your food footprint significantly.`,
        priority: 2,
        estimatedTime: '1 week',
        actionableSteps: [
          'Choose one day (e.g., Meatless Monday) to eat fully vegetarian.',
          'Replace beef or lamb with low-carbon proteins like lentils, chickpeas, or tofu.',
          'Try veggie versions of familiar recipes, such as vegetable lasagna or bean burgers.'
        ]
      });
    } else {
      recommendations.push({
        id: 'rec_food_local',
        title: 'Choose organic and locally sourced seasonal foods',
        category: 'food',
        co2ReductionAnnual: 90,
        monthlySavings: 0, // Organic can sometimes be slightly more expensive, but local seasonal is economical
        difficulty: 'medium',
        impact: 'medium',
        confidence: 80,
        reasoning: 'Selecting local seasonal produce reduces food miles (emissions from long-distance global shipping and refrigeration transport).',
        priority: 3,
        estimatedTime: '2 weeks',
        actionableSteps: [
          'Shop at weekend farmers markets or request local farm-share boxes.',
          'Consult a seasonal produce chart before planning weekly meals.'
        ]
      });
    }

    // RECOMMENDATION 5: Waste & Recycling Composting
    if (weeklyOrganicWasteKg > 2 || weeklyPlasticWasteKg > 2) {
      const recyclingOffset = Math.abs(EMISSION_FACTORS.waste.recycling);
      const plasticWeight = typeTotals['plastic_waste'] ? weeklyPlasticWasteKg : 2;
      const co2ReductionAnnualWaste = plasticWeight * recyclingOffset * 52;

      recommendations.push({
        id: 'rec_waste_recycle',
        title: 'Recycle all plastics, cans, and paper consistently',
        category: 'waste',
        co2ReductionAnnual: Math.round(co2ReductionAnnualWaste),
        monthlySavings: 0,
        difficulty: 'low',
        impact: 'medium',
        confidence: 95,
        reasoning: `Diverting reusable materials from general landfills prevents methane emissions and offsets primary manufacturing energy.`,
        priority: 2,
        estimatedTime: 'Immediate',
        actionableSteps: [
          'Place separate recycling bins directly next to the general waste bin.',
          'Rinse plastic and tin containers before tossing to avoid contamination.',
          'Check municipal guidelines for accepted plastic numbers (e.g., PET 1, HDPE 2).'
        ]
      });
    }

    return recommendations.sort((a, b) => a.priority - b.priority);
  }
}
export default RecommendationEngine;
