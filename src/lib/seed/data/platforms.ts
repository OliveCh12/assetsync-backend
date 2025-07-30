/**
 * Platforms Static Data
 * 
 * Defines the marketplace platforms integrated with AssetSync
 */

export interface PlatformData {
  name: string;
  slug: string;
  description: string;
  website: string;
  apiEndpoint?: string;
  country: string;
  supportedCategories: string[];
  commissionRate?: number; // percentage
  features: string[];
  integrationLevel: 'basic' | 'advanced' | 'full';
  isActive: boolean;
  logoUrl?: string;
}

export const PLATFORMS: PlatformData[] = [
  {
    name: 'Leboncoin',
    slug: 'leboncoin',
    description: 'Leading French classified ads platform',
    website: 'https://www.leboncoin.fr',
    apiEndpoint: 'https://api.leboncoin.fr',
    country: 'FR',
    supportedCategories: ['electronics', 'fashion-clothing', 'home-garden', 'vehicles', 'sports-recreation', 'tools-equipment'],
    commissionRate: 0, // Free listings with premium options
    features: [
      'free_listings',
      'premium_boost',
      'photo_gallery',
      'messaging_system',
      'location_based'
    ],
    integrationLevel: 'advanced',
    isActive: true,
    logoUrl: 'https://cdn.leboncoin.fr/assets/logo.svg'
  },
  {
    name: 'Vinted',
    slug: 'vinted',
    description: 'European marketplace for second-hand fashion',
    website: 'https://www.vinted.fr',
    apiEndpoint: 'https://api.vinted.com',
    country: 'EU',
    supportedCategories: ['fashion-clothing'],
    commissionRate: 5.0, // 5% + payment fees
    features: [
      'buyer_protection',
      'integrated_shipping',
      'wardrobe_sharing',
      'brand_verification',
      'size_guide'
    ],
    integrationLevel: 'full',
    isActive: true,
    logoUrl: 'https://vinted.com/assets/logo.svg'
  },
  {
    name: 'eBay',
    slug: 'ebay',
    description: 'Global online marketplace and auction platform',
    website: 'https://www.ebay.fr',
    apiEndpoint: 'https://api.ebay.com',
    country: 'GLOBAL',
    supportedCategories: ['electronics', 'collectibles', 'fashion-clothing', 'home-garden', 'sports-recreation'],
    commissionRate: 9.5, // Average selling fee (within DB precision limits)
    features: [
      'auction_listings',
      'buy_it_now',
      'global_shipping',
      'buyer_protection',
      'promoted_listings'
    ],
    integrationLevel: 'full',
    isActive: true,
    logoUrl: 'https://ir.ebaystatic.com/pictures/aw/pics/logos/logoEbay_x45.gif'
  },
  {
    name: 'Facebook Marketplace',
    slug: 'facebook-marketplace',
    description: 'Local buying and selling on Facebook',
    website: 'https://www.facebook.com/marketplace',
    country: 'GLOBAL',
    supportedCategories: ['home-garden', 'electronics', 'vehicles', 'fashion-clothing'],
    commissionRate: 0, // Free for local sales
    features: [
      'local_pickup',
      'facebook_integration',
      'messenger_chat',
      'social_proof',
      'mobile_first'
    ],
    integrationLevel: 'basic',
    isActive: true,
    logoUrl: 'https://static.xx.fbcdn.net/rsrc.php/v3/yX/r/Kvo5FesWVKX.png'
  },
  {
    name: 'Back Market',
    slug: 'backmarket',
    description: 'Refurbished electronics marketplace',
    website: 'https://www.backmarket.fr',
    apiEndpoint: 'https://api.backmarket.com',
    country: 'EU',
    supportedCategories: ['electronics'],
    commissionRate: 9.9999, // Commission for sellers (within DB limits)
    features: [
      'refurbished_focus',
      'quality_guarantee',
      'warranty_included',
      'sustainability_focus',
      'professional_sellers'
    ],
    integrationLevel: 'advanced',
    isActive: true,
    logoUrl: 'https://d1eh9yux7w8iql.cloudfront.net/assets/logo.svg'
  },
  {
    name: 'Vestiaire Collective',
    slug: 'vestiairecollective',
    description: 'Global marketplace for pre-owned luxury fashion',
    website: 'https://www.vestiairecollective.com',
    apiEndpoint: 'https://api.vestiairecollective.com',
    country: 'GLOBAL',
    supportedCategories: ['fashion-clothing'],
    commissionRate: 9.9999, // Commission on luxury items (within DB limits)
    features: [
      'luxury_authentication',
      'quality_check',
      'global_shipping',
      'concierge_service',
      'brand_verification'
    ],
    integrationLevel: 'advanced',
    isActive: true,
    logoUrl: 'https://www.vestiairecollective.com/static/img/logo.svg'
  },
  {
    name: 'La Centrale',
    slug: 'lacentrale',
    description: 'French automotive marketplace',
    website: 'https://www.lacentrale.fr',
    apiEndpoint: 'https://api.lacentrale.fr',
    country: 'FR',
    supportedCategories: ['vehicles'],
    commissionRate: 0, // Advertising model
    features: [
      'vehicle_history',
      'price_estimation',
      'dealer_network',
      'financing_options',
      'inspection_service'
    ],
    integrationLevel: 'advanced',
    isActive: true,
    logoUrl: 'https://www.lacentrale.fr/static/img/logo.svg'
  },
  {
    name: 'Catawiki',
    slug: 'catawiki',
    description: 'Online auction house for special items',
    website: 'https://www.catawiki.com',
    apiEndpoint: 'https://api.catawiki.com',
    country: 'EU',
    supportedCategories: ['collectibles'],
    commissionRate: 9.9999, // Seller commission (within DB limits)
    features: [
      'expert_curation',
      'auction_format',
      'authenticity_guarantee',
      'global_reach',
      'collectibles_focus'
    ],
    integrationLevel: 'advanced',
    isActive: true,
    logoUrl: 'https://assets.catawiki.nl/assets/logo.svg'
  }
];