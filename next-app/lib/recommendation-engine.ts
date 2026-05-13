// Types and Interfaces
export interface Concern {
  name: string;
  score: number;
  severity: 'mild' | 'moderate' | 'high';
  explanation: string;
  recommendedIngredient: string;
}

export interface SkinReport {
  overallGlowScore: number;
  skinType: string;
  concerns: Concern[];
  insights: { finding: string; explanation: string }[];
  climateNote: string;
  routineComplexity: 'basic' | 'intermediate' | 'advanced';
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_inr: number;
  image_url: string;
  affiliate_url: string;
  key_ingredients: string[];
  skin_types: string[]; // e.g., ['oily', 'dry', 'combination', 'normal', 'sensitive']
  concerns_targeted: string[]; // e.g., ['acne', 'pigmentation', 'dryness', 'dullness']
  climate_suitability: string[]; // ['humid', 'dry', 'moderate']
  texture: string; // 'gel' | 'cream' | 'serum' | 'foam' | 'liquid' | 'oil' | 'balm'
  korean_step: string; // 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'spf'
}

export interface RoutineKit {
  cleanser: Product | null;
  toner: Product | null;
  serum: Product | null;
  moisturizer: Product | null;
  spf: Product | null;
}

// Concern -> Ingredient Mapping
export function getConcernIngredients(concern: string): string[] {
  const mapping: Record<string, string[]> = {
    acne: ['Salicylic Acid', 'Centella Asiatica', 'Tea Tree', 'BHA'],
    pigmentation: ['Niacinamide', 'Vitamin C', 'Alpha Arbutin', 'Tranexamic Acid'],
    dryness: ['Hyaluronic Acid', 'Ceramides', 'Snail Mucin', 'Glycerin'],
    dullness: ['Vitamin C', 'AHA', 'Glycolic Acid', 'Lactic Acid', 'Glow essence'],
    texture: ['BHA', 'AHA', 'Retinol', 'Salicylic Acid'],
    pores: ['Niacinamide', 'Salicylic Acid', 'Clay'],
    sensitivity: ['Centella Asiatica', 'Aloe', 'Panthenol', 'Mugwort', 'Fragrance-free'],
  };
  
  const key = concern.toLowerCase();
  for (const mapKey in mapping) {
    if (key.includes(mapKey)) return mapping[mapKey];
  }
  return [];
}

// City -> Climate mapping logic
function getCityClimate(city: string): 'humid' | 'dry' | 'moderate' {
  const humidCities = ['mumbai', 'chennai', 'kolkata', 'kochi', 'goa', 'surat'];
  const dryCities = ['delhi', 'jaipur', 'ahmedabad', 'hyderabad', 'pune', 'nagpur', 'jodhpur'];
  // Default moderate for places like Bangalore, Bangalore, etc if not purely dry/humid
  
  const cityKey = city.toLowerCase().trim();
  if (humidCities.some(c => cityKey.includes(c))) return 'humid';
  if (dryCities.some(c => cityKey.includes(c))) return 'dry';
  return 'moderate';
}

function getSeason(): 'summer' | 'monsoon' | 'winter' | 'spring_autumn' {
  const month = new Date().getMonth(); // 0 is January, 11 is December
  if (month >= 2 && month <= 4) return 'summer'; // Mar-May
  if (month >= 5 && month <= 8) return 'monsoon'; // Jun-Sep
  if (month >= 10 || month <= 1) return 'winter'; // Nov-Feb
  return 'spring_autumn'; // Oct
}

// Score product
export function scoreProduct(
  product: Product, 
  report: SkinReport, 
  climate: 'humid' | 'dry' | 'moderate',
  season: string
): number {
  let score = 0;
  
  // 1. Skin Type Match (weight 0.3)
  const isSkinTypeMatch = product.skin_types.some(t => 
    report.skinType.toLowerCase().includes(t.toLowerCase())
  );
  if (isSkinTypeMatch) score += 30;

  // 2. Concerns Match (weight 0.5)
  // Identify how many of the top 3 concerns the product targets
  let concernMatchCount = 0;
  const topConcerns = report.concerns.slice(0, 3).map(c => c.name.toLowerCase());
  
  for (const concern of topConcerns) {
    if (product.concerns_targeted.some(t => concern.includes(t.toLowerCase()))) {
      concernMatchCount++;
    }
  }
  
  if (concernMatchCount > 0) {
    score += Math.min((concernMatchCount / topConcerns.length) * 50, 50);
  }

  // Check ingredient matches to concerns directly to boost score slightly
  for (const concern of report.concerns) {
    const recommendedIng = concern.recommendedIngredient.toLowerCase();
    if (product.key_ingredients.some(ing => ing.toLowerCase().includes(recommendedIng))) {
      score += 10;
    }
  }

  // 3. Climate Match (weight 0.2)
  if (product.climate_suitability.includes(climate)) {
    score += 20;
  }

  // 4. Season & Texture Adjustments (Penalties / Boosts)
  const pTexture = product.texture.toLowerCase();
  
  // Monsoon + Humid
  if (season === 'monsoon' && climate === 'humid') {
    if (pTexture === 'gel' || pTexture === 'liquid') score += 15;
    if (pTexture === 'cream' || pTexture === 'oil') score -= 20;
  }
  
  // Winter + Dry
  if (season === 'winter' && (climate === 'dry' || climate === 'moderate')) {
    if (pTexture === 'cream') score += 15;
    if (product.key_ingredients.some(i => i.toLowerCase().includes('ceramide'))) score += 10;
    if (pTexture === 'gel') score -= 10;
  }

  // Summer
  if (season === 'summer') {
    if (pTexture === 'gel' || pTexture === 'liquid') score += 15;
    if (pTexture === 'cream' || pTexture === 'balm') score -= 20;
  }
  
  return score;
}

// Generate the personalized routine kit
export function getRoutine(report: SkinReport, city: string, productCatalog: Product[]): RoutineKit {
  const climate = getCityClimate(city);
  const season = getSeason();
  
  const routine: RoutineKit = {
    cleanser: null,
    toner: null,
    serum: null,
    moisturizer: null,
    spf: null
  };
  
  const orderSteps: Array<keyof RoutineKit> = ['cleanser', 'toner', 'serum', 'moisturizer', 'spf'];
  
  for (const step of orderSteps) {
    const stepProducts = productCatalog.filter(p => p.korean_step.toLowerCase() === step);
    
    if (stepProducts.length > 0) {
      const scoredProducts = stepProducts.map(p => ({
        product: p,
        score: scoreProduct(p, report, climate, season)
      }));
      
      // Sort descending by score
      scoredProducts.sort((a, b) => b.score - a.score);
      
      // Assign the best scoring product to the routine slot
      routine[step] = scoredProducts[0].product;
    }
  }

  return routine;
}
