import { Product } from './recommendation-engine';

export interface ClimateProfile {
  type: string;
  humidity: 'very_low' | 'low_dry' | 'moderate' | 'high' | 'very_high';
  pollution: 'low' | 'moderate' | 'high';
  uvIndex: 'high' | 'very_high' | 'extreme';
}

export const CITY_CLIMATES: Record<string, ClimateProfile> = {
  Mumbai:    { type: 'tropical_humid', humidity: 'high',   pollution: 'moderate', uvIndex: 'very_high' },
  Delhi:     { type: 'semi_arid',      humidity: 'low_dry', pollution: 'high',     uvIndex: 'high'      },
  Bangalore: { type: 'tropical_mild',  humidity: 'moderate', pollution: 'low',     uvIndex: 'high'      },
  Chennai:   { type: 'tropical_humid', humidity: 'very_high', pollution: 'low',    uvIndex: 'very_high' },
  Kolkata:   { type: 'tropical_humid', humidity: 'high',   pollution: 'moderate', uvIndex: 'high'      },
  Hyderabad: { type: 'semi_arid',      humidity: 'moderate', pollution: 'low',    uvIndex: 'very_high' },
  Pune:      { type: 'tropical_mild',  humidity: 'moderate', pollution: 'low',     uvIndex: 'high'      },
  Jaipur:    { type: 'desert_arid',    humidity: 'very_low', pollution: 'moderate', uvIndex: 'extreme'  },
  default:   { type: 'tropical_mild',  humidity: 'moderate', pollution: 'low',     uvIndex: 'high'      }
};

export function getCityClimate(city: string): ClimateProfile {
  if (!city) return CITY_CLIMATES.default;
  
  const normalizedCity = city.trim();
  const matchedKey = Object.keys(CITY_CLIMATES).find(
    (key) => key.toLowerCase() === normalizedCity.toLowerCase()
  );
  
  if (matchedKey) {
    return CITY_CLIMATES[matchedKey];
  }
  return CITY_CLIMATES.default;
}

export function getClimateAdvice(climate: ClimateProfile): string {
  // specific examples matched from requirements
  if ((climate.humidity === 'high' || climate.humidity === 'very_high') && climate.type === 'tropical_humid') {
    return "High humidity means your skin produces more oil. Lightweight, water-based layers prevent clogging. Always use SPF 50.";
  }
  
  if (climate.pollution === 'high' && (climate.humidity === 'low_dry' || climate.humidity === 'very_low')) {
    return "High pollution and dry air strip your skin barrier. Double cleansing nightly and a barrier-repair moisturizer are essential.";
  }
  
  if (climate.type === 'tropical_mild' && climate.pollution === 'low') {
    return "A mild climate lets you build a balanced routine without extremes. Great time to introduce actives.";
  }

  // Fallbacks
  if (climate.uvIndex === 'extreme' || climate.uvIndex === 'very_high') {
    return "Intense UV levels in your area require diligent sun protection. Apply high SPF and prioritize antioxidant serums like Vitamin C.";
  }

  return "A balanced routine focusing on hydration, gentle cleansing, and daily SPF will keep your skin healthy in this climate.";
}

export function adjustRoutineForClimate(routine: Product[], climate: ClimateProfile): Product[] {
  // This function simulates the adjustments requested. 
  // In a live system, this might instead query the DB for alternative products.
  return routine.map(product => {
    const adjustedProduct = { ...product };

    // High humidity -> swap cream to gel
    if ((climate.humidity === 'high' || climate.humidity === 'very_high') && product.texture === 'cream') {
      adjustedProduct.texture = 'gel';
    }

    // Low humidity -> richer moisturizer
    if ((climate.humidity === 'low_dry' || climate.humidity === 'very_low') && product.korean_step === 'moisturizer' && product.texture === 'gel') {
      adjustedProduct.texture = 'cream';
    }

    // Determine if we need to adjust properties indicating high SPF needs or pollutants 
    // (This acts as a flag that higher level logic or UI could use to inform the user)

    return adjustedProduct;
  });
}

export function getSeasonalTip(city: string, month: number): string {
  const profile = getCityClimate(city);
  
  // Summer (Mar-May, indices 2-4)
  if (month >= 2 && month <= 4) {
    if (profile.humidity === 'high' || profile.humidity === 'very_high') {
      return "Summer humidity is rising. Switch to a gel moisturizer and don't skip your double cleanse to prevent sweat-induced breakouts.";
    }
    if (profile.type === 'semi_arid' || profile.type === 'desert_arid') {
      return "Scorching summer heat can dehydrate your skin. Keep a facial mist handy and reapply SPF every 2 hours.";
    }
    return "Summer heat calls for lighter layers. Swap out heavy creams for gels and prioritize strict SPF reapplication.";
  }

  // Monsoon (Jun-Sep, indices 5-8)
  if (month >= 5 && month <= 8) {
    if (profile.humidity === 'high' || profile.humidity === 'very_high') {
      return "Monsoon brings stickiness. Use a salicylic acid cleanser to keep pores clear and stick to oil-free hydration.";
    }
    return "Monsoons can make the skin unpredictable. Stick to gentle pH-balanced cleansers and maintain skin barrier health.";
  }

  // Winter (Nov-Feb, indices 10, 11, 0, 1)
  if (month >= 10 || month <= 1) {
    if (profile.type === 'semi_arid' || profile.humidity === 'low_dry' || profile.type === 'desert_arid') {
      return "Winter air is dry and harsh. Layer a hydrating toner and seal it in with a ceramide-rich cream.";
    }
    return "Winter calls for extra hydration. Add a hydrating essence to your routine and lock it in with a slightly richer moisturizer.";
  }

  // Spring/Autumn (Oct, index 9)
  return "Consistency is key during transition seasons. Follow your personalized routine and always finish with sunscreen.";
}
