/**
 * Asset Data Generators
 * 
 * Faker-based generators for creating realistic asset test data
 */

import { faker } from '@faker-js/faker';

export interface GeneratedAsset {
  userId: string;
  organizationId?: string;
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  status: 'active' | 'sold' | 'archived' | 'damaged' | 'lost';
  purchasePrice: string;
  purchaseDate: Date;
  purchaseCurrency: string;
  purchaseLocation?: string;
  receiptUrl?: string;
  plannedSaleDate?: Date;
  targetSalePrice?: string;
  images?: string[];
  specifications?: Record<string, any>;
  tags?: string[];
  notes?: string;
  assignedTo?: string;
  createdBy: string;
}

/**
 * Category-specific asset generators
 */
const ASSET_GENERATORS = {
  electronics: () => ({
    name: faker.helpers.arrayElement([
      `${faker.helpers.arrayElement(['Apple', 'Samsung', 'Google', 'OnePlus', 'Sony'])} ${faker.helpers.arrayElement(['iPhone', 'Galaxy', 'Pixel', 'Xperia'])} ${faker.helpers.arrayElement(['14', '15', 'Pro', 'Max', 'Ultra'])}`,
      `${faker.helpers.arrayElement(['MacBook', 'ThinkPad', 'Dell XPS', 'Surface'])} ${faker.helpers.arrayElement(['Pro', 'Air', 'Studio'])}`,
      `${faker.helpers.arrayElement(['PlayStation', 'Xbox', 'Nintendo'])} ${faker.helpers.arrayElement(['5', 'Series X', 'Switch'])}`
    ]),
    brand: faker.helpers.arrayElement(['Apple', 'Samsung', 'Google', 'Sony', 'Dell', 'HP', 'Lenovo']),
    model: faker.string.alphanumeric(8).toUpperCase(),
    serialNumber: faker.string.alphanumeric(12).toUpperCase(),
    specifications: {
      color: faker.color.human(),
      storage: faker.helpers.arrayElement(['64GB', '128GB', '256GB', '512GB', '1TB']),
      warranty: faker.helpers.arrayElement(['6 months', '1 year', '2 years', 'expired'])
    }
  }),

  'fashion-clothing': () => ({
    name: faker.helpers.arrayElement([
      `${faker.helpers.arrayElement(['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo'])} ${faker.helpers.arrayElement(['T-Shirt', 'Sweater', 'Jeans', 'Dress', 'Jacket'])}`,
      `${faker.helpers.arrayElement(['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès'])} ${faker.helpers.arrayElement(['Handbag', 'Wallet', 'Scarf', 'Belt'])}`
    ]),
    brand: faker.helpers.arrayElement(['Nike', 'Adidas', 'Zara', 'H&M', 'Louis Vuitton', 'Gucci']),
    specifications: {
      size: faker.helpers.arrayElement(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
      color: faker.color.human(),
      material: faker.helpers.arrayElement(['Cotton', 'Polyester', 'Wool', 'Leather', 'Silk']),
      season: faker.helpers.arrayElement(['Spring/Summer', 'Fall/Winter', 'All seasons'])
    }
  }),

  'home-garden': () => ({
    name: faker.helpers.arrayElement([
      `${faker.helpers.arrayElement(['IKEA', 'Maisons du Monde', 'Conforama'])} ${faker.helpers.arrayElement(['Sofa', 'Table', 'Chair', 'Wardrobe', 'Bed'])}`,
      `${faker.helpers.arrayElement(['Bosch', 'Whirlpool', 'Samsung'])} ${faker.helpers.arrayElement(['Washing Machine', 'Dishwasher', 'Refrigerator'])}`
    ]),
    brand: faker.helpers.arrayElement(['IKEA', 'Maisons du Monde', 'Bosch', 'Whirlpool']),
    specifications: {
      material: faker.helpers.arrayElement(['Wood', 'Metal', 'Plastic', 'Glass', 'Fabric']),
      dimensions: `${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 50, max: 200 })}x${faker.number.int({ min: 30, max: 100 })}cm`,
      weight: `${faker.number.int({ min: 5, max: 50 })}kg`
    }
  }),

  vehicles: () => ({
    name: faker.helpers.arrayElement([
      `${faker.helpers.arrayElement(['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Peugeot', 'Renault'])} ${faker.helpers.arrayElement(['3 Series', 'C-Class', 'A4', 'Golf', '308', 'Clio'])}`,
      `${faker.helpers.arrayElement(['Yamaha', 'Honda', 'Kawasaki'])} ${faker.helpers.arrayElement(['MT-07', 'CBR600', 'Ninja 250'])}`
    ]),
    brand: faker.helpers.arrayElement(['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Peugeot', 'Renault']),
    specifications: {
      year: faker.number.int({ min: 2010, max: 2024 }),
      mileage: `${faker.number.int({ min: 10000, max: 200000 })} km`,
      fuel: faker.helpers.arrayElement(['Petrol', 'Diesel', 'Electric', 'Hybrid']),
      transmission: faker.helpers.arrayElement(['Manual', 'Automatic'])
    }
  }),

  default: () => ({
    name: faker.commerce.productName(),
    brand: faker.company.name(),
    specifications: {
      color: faker.color.human(),
      weight: `${faker.number.float({ min: 0.1, max: 50, fractionDigits: 1 })}kg`
    }
  })
};

/**
 * Generate a realistic asset based on category
 */
export function generateAsset(
  userId: string,
  categoryId: string,
  categorySlug: string,
  overwrites: Partial<GeneratedAsset> = {}
): GeneratedAsset {
  const generator = ASSET_GENERATORS[categorySlug as keyof typeof ASSET_GENERATORS] || ASSET_GENERATORS.default;
  const categoryData = generator();

  const purchasePrice = faker.number.int({ min: 10, max: 5000 });
  const condition = faker.helpers.arrayElement(['new', 'excellent', 'good', 'fair', 'poor']);
  
  // Generate realistic images URLs (placeholder service)
  const imageCount = faker.number.int({ min: 1, max: 5 });
  const images = Array.from({ length: imageCount }, (_, i) => 
    `https://picsum.photos/800/600?random=${faker.string.alphanumeric(8)}`
  );

  return {
    userId,
    categoryId,
    name: categoryData.name,
    description: faker.helpers.arrayElement([
      faker.lorem.sentences(2, ' '),
      faker.lorem.sentences(3, ' '),
      undefined
    ]),
    brand: categoryData.brand,
    model: categoryData.model,
    serialNumber: categoryData.serialNumber,
    condition,
    status: faker.helpers.weightedArrayElement([
      { weight: 70, value: 'active' },
      { weight: 15, value: 'sold' },
      { weight: 10, value: 'archived' },
      { weight: 3, value: 'damaged' },
      { weight: 2, value: 'lost' }
    ]),
    purchasePrice: purchasePrice.toString(),
    purchaseDate: faker.date.past({ years: 3 }),
    purchaseCurrency: 'EUR',
    purchaseLocation: faker.helpers.arrayElement([
      faker.company.name(),
      'Online',
      faker.location.city(),
      undefined
    ]),
    receiptUrl: faker.helpers.arrayElement([
      `https://example.com/receipts/${faker.string.alphanumeric(10)}.pdf`,
      undefined
    ]),
    plannedSaleDate: faker.helpers.arrayElement([
      faker.date.future({ years: 1 }),
      undefined
    ]),
    targetSalePrice: faker.helpers.arrayElement([
      (purchasePrice * faker.number.float({ min: 0.3, max: 0.8 })).toFixed(2),
      undefined
    ]),
    images,
    specifications: categoryData.specifications,
    tags: faker.helpers.arrayElements([
      'urgent', 'vintage', 'rare', 'limited-edition', 'like-new', 'quick-sale'
    ], { min: 0, max: 3 }),
    notes: faker.helpers.arrayElement([
      faker.lorem.sentences(1, ' '),
      undefined
    ]),
    createdBy: userId,
    ...overwrites
  };
}

/**
 * Generate multiple assets for different users and categories
 */
export function generateAssets(
  userIds: string[],
  categoryMap: Record<string, string>, // slug -> id mapping
  count: number
): GeneratedAsset[] {
  const assets: GeneratedAsset[] = [];
  const categoryEntries = Object.entries(categoryMap);

  for (let i = 0; i < count; i++) {
    const userId = faker.helpers.arrayElement(userIds);
    const [categorySlug, categoryId] = faker.helpers.arrayElement(categoryEntries);
    
    assets.push(generateAsset(userId, categoryId, categorySlug));
  }

  return assets;
}