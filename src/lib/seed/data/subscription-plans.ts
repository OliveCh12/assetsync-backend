/**
 * Subscription Plans Static Data
 * 
 * Defines the pricing tiers for AssetSync following the freemium model
 */

export interface SubscriptionPlanData {
  name: string;
  slug: string;
  description: string;
  type: 'free' | 'premium' | 'starter' | 'business' | 'enterprise';
  monthlyPrice?: number;
  yearlyPrice?: number;
  currency: string;
  maxAssets?: number; // null = unlimited
  maxUsers?: number;
  maxOrganizations?: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanData[] = [
  // Personal Plans
  {
    name: 'Personal Free',
    slug: 'personal-free',
    description: 'Perfect for tracking your personal belongings',
    type: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: 'EUR',
    maxAssets: 50,
    maxUsers: 1,
    maxOrganizations: 0,
    features: [
      'up_to_50_objects',
      'basic_estimations',
      'manual_listings',
      'basic_categories',
      'mobile_app_access'
    ],
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Personal Premium',
    slug: 'personal-premium',
    description: 'Unlimited tracking with advanced features',
    type: 'premium',
    monthlyPrice: 6.99,
    yearlyPrice: 69.90, // 2 months free
    currency: 'EUR',
    maxAssets: undefined, // unlimited
    maxUsers: 1,
    maxOrganizations: 0,
    features: [
      'unlimited_objects',
      'multi_scenario_valuation',
      'automated_listings',
      'price_alerts',
      'advanced_analytics',
      'bulk_import_export',
      'priority_support'
    ],
    isActive: true,
    sortOrder: 2
  },

  // Professional Plans
  {
    name: 'Professional Starter',
    slug: 'professional-starter',
    description: 'Small teams and businesses getting started',
    type: 'starter',
    monthlyPrice: 25.00,
    yearlyPrice: 250.00, // 2 months free
    currency: 'EUR',
    maxAssets: 200,
    maxUsers: 5,
    maxOrganizations: 1,
    features: [
      'up_to_200_assets',
      '5_team_members',
      'basic_reporting',
      'csv_exports',
      'email_support',
      'asset_assignments',
      'basic_integrations'
    ],
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Professional Business',
    slug: 'professional-business',
    description: 'Growing businesses with advanced needs',
    type: 'business',
    monthlyPrice: 75.00,
    yearlyPrice: 750.00, // 2 months free
    currency: 'EUR',
    maxAssets: 1000,
    maxUsers: 20,
    maxOrganizations: 3,
    features: [
      'up_to_1000_assets',
      '20_team_members',
      'advanced_reporting',
      'accounting_integration',
      'custom_fields',
      'api_access',
      'priority_support',
      'bulk_operations',
      'advanced_permissions'
    ],
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Professional Enterprise',
    slug: 'professional-enterprise',
    description: 'Large organizations with custom requirements',
    type: 'enterprise',
    monthlyPrice: undefined, // Custom pricing
    yearlyPrice: undefined,
    currency: 'EUR',
    maxAssets: undefined, // unlimited
    maxUsers: undefined, // unlimited
    maxOrganizations: undefined, // unlimited
    features: [
      'unlimited_assets',
      'unlimited_users',
      'custom_integrations',
      'dedicated_support',
      'sla_guarantee',
      'custom_branding',
      'advanced_security',
      'on_premise_deployment',
      'custom_training'
    ],
    isActive: true,
    sortOrder: 5
  }
];