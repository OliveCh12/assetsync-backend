/**
 * Asset Categories Static Data
 * 
 * Defines the hierarchical category structure for AssetSync
 */

export interface CategoryData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  depreciationProfile?: {
    curve_type: string;
    annual_rate: number;
    factors: string[];
  };
  marketplaces?: string[];
}

export interface SubcategoryData {
  name: string;
  slug: string;
  description: string;
  parent: string;
  icon: string;
}

export const MAIN_CATEGORIES: CategoryData[] = [
  {
    name: 'Electronics',
    slug: 'electronics',
    description: 'Computers, phones, gaming devices, cameras, and electronic gadgets',
    icon: 'laptop',
    depreciationProfile: {
      curve_type: 'exponential',
      annual_rate: 0.25,
      factors: ['technology_advancement', 'brand_reputation', 'condition']
    },
    marketplaces: ['leboncoin', 'ebay', 'amazon', 'backmarket']
  },
  {
    name: 'Fashion & Clothing',
    slug: 'fashion-clothing',
    description: 'Clothing, shoes, accessories, and fashion items',
    icon: 'shirt',
    depreciationProfile: {
      curve_type: 'steep_initial',
      annual_rate: 0.40,
      factors: ['brand_prestige', 'seasonal_trends', 'condition']
    },
    marketplaces: ['vinted', 'vestiairecollective', 'leboncoin']
  },
  {
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Furniture, appliances, garden equipment, and home decoration',
    icon: 'home',
    depreciationProfile: {
      curve_type: 'moderate',
      annual_rate: 0.15,
      factors: ['material_quality', 'brand', 'condition']
    },
    marketplaces: ['leboncoin', 'facebook_marketplace', 'selency']
  },
  {
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Cars, motorcycles, bicycles, and other transportation',
    icon: 'car',
    depreciationProfile: {
      curve_type: 'standard_automotive',
      annual_rate: 0.20,
      factors: ['mileage', 'age', 'maintenance_history', 'brand']
    },
    marketplaces: ['leboncoin', 'lacentrale', 'autoscout24']
  },
  {
    name: 'Sports & Recreation',
    slug: 'sports-recreation',
    description: 'Sports equipment, fitness gear, outdoor and recreational items',
    icon: 'dumbbell',
    depreciationProfile: {
      curve_type: 'moderate',
      annual_rate: 0.18,
      factors: ['usage_intensity', 'seasonal_demand', 'condition']
    },
    marketplaces: ['leboncoin', 'decathlon_occasion', 'troc_sport']
  },
  {
    name: 'Tools & Equipment',
    slug: 'tools-equipment',
    description: 'Power tools, garden equipment, machinery, and professional tools',
    icon: 'wrench',
    depreciationProfile: {
      curve_type: 'slow',
      annual_rate: 0.12,
      factors: ['brand_reputation', 'professional_grade', 'condition']
    },
    marketplaces: ['leboncoin', 'machineseeker', 'marketplace_pro']
  },
  {
    name: 'Collectibles',
    slug: 'collectibles',
    description: 'Art, vintage items, books, vinyl records, trading cards, antiques',
    icon: 'gem',
    depreciationProfile: {
      curve_type: 'appreciation_potential',
      annual_rate: -0.05, // Can appreciate
      factors: ['rarity', 'historical_significance', 'condition', 'market_trends']
    },
    marketplaces: ['ebay', 'catawiki', 'delcampe', 'drouot']
  }
];

export const SUBCATEGORIES: SubcategoryData[] = [
  // Electronics subcategories
  {
    name: 'Smartphones & Tablets',
    slug: 'smartphones-tablets',
    description: 'Mobile phones, tablets, and accessories',
    parent: 'electronics',
    icon: 'smartphone'
  },
  {
    name: 'Computers & Laptops',
    slug: 'computers-laptops',
    description: 'Desktop computers, laptops, and computer accessories',
    parent: 'electronics',
    icon: 'laptop'
  },
  {
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming consoles, games, and gaming accessories',
    parent: 'electronics',
    icon: 'gamepad'
  },
  {
    name: 'Audio & Video',
    slug: 'audio-video',
    description: 'Headphones, speakers, cameras, and entertainment devices',
    parent: 'electronics',
    icon: 'headphones'
  },

  // Fashion subcategories
  {
    name: 'Women\'s Clothing',
    slug: 'womens-clothing',
    description: 'Women\'s clothing and accessories',
    parent: 'fashion-clothing',
    icon: 'shirt'
  },
  {
    name: 'Men\'s Clothing', 
    slug: 'mens-clothing',
    description: 'Men\'s clothing and accessories',
    parent: 'fashion-clothing',
    icon: 'shirt'
  },
  {
    name: 'Shoes',
    slug: 'shoes',
    description: 'All types of footwear',
    parent: 'fashion-clothing',
    icon: 'shoe-heel'
  },
  {
    name: 'Bags & Accessories',
    slug: 'bags-accessories', 
    description: 'Handbags, backpacks, jewelry, and accessories',
    parent: 'fashion-clothing',
    icon: 'handbag'
  },

  // Home & Garden subcategories
  {
    name: 'Furniture',
    slug: 'furniture',
    description: 'Tables, chairs, sofas, beds, and other furniture',
    parent: 'home-garden',
    icon: 'armchair'
  },
  {
    name: 'Appliances',
    slug: 'appliances',
    description: 'Kitchen appliances, washing machines, and home appliances',
    parent: 'home-garden',
    icon: 'refrigerator'
  },
  {
    name: 'Garden Equipment',
    slug: 'garden-equipment',
    description: 'Lawn mowers, garden tools, and outdoor equipment',
    parent: 'home-garden',
    icon: 'leaf'
  }
];