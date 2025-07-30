/**
 * User Data Generators
 * 
 * Faker-based generators for creating realistic user test data
 */

import { faker } from '@faker-js/faker';

export interface GeneratedUser {
  email: string;
  passwordHash: string; // Will be hashed separately
  firstName: string;
  lastName: string;
  avatar?: string;
  type: 'personal' | 'professional';
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
}

export interface GeneratedOrganization {
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  logo?: string;
  address?: string;
  phone?: string;
  vatNumber?: string;
}

/**
 * Generate a realistic user with consistent data
 */
export function generateUser(overwrites: Partial<GeneratedUser> = {}): GeneratedUser {
  const sex = faker.person.sexType();
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();
  
  // Generate avatar using a service like Gravatar or UI Avatars
  const avatar = faker.helpers.arrayElement([
    `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
    `https://robohash.org/${firstName}${lastName}?set=set1&size=200x200`,
    undefined // Some users might not have avatars
  ]);

  return {
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    passwordHash: 'TestPassword123!', // Will be hashed by the seeder
    firstName,
    lastName,
    avatar,
    type: faker.helpers.arrayElement(['personal', 'professional']),
    emailVerified: faker.helpers.arrayElement([true, true, true, false]), // 75% verified
    emailVerifiedAt: faker.helpers.arrayElement([
      faker.date.past({ years: 1 }),
      undefined
    ]),
    lastLoginAt: faker.helpers.arrayElement([
      faker.date.recent({ days: 30 }),
      faker.date.recent({ days: 7 }),
      faker.date.recent({ days: 1 }),
      undefined
    ]),
    ...overwrites
  };
}

/**
 * Generate a batch of users with different characteristics
 */
export function generateUsers(count: number): GeneratedUser[] {
  const users: GeneratedUser[] = [];
  
  for (let i = 0; i < count; i++) {
    // Create different types of users for variety
    if (i === 0) {
      // First user is always a verified personal user for testing
      users.push(generateUser({
        email: 'test.personal@example.com',
        type: 'personal',
        emailVerified: true,
        emailVerifiedAt: faker.date.past({ years: 1 }),
        lastLoginAt: faker.date.recent({ days: 1 })
      }));
    } else if (i === 1) {
      // Second user is a professional user for testing
      users.push(generateUser({
        email: 'test.professional@example.com',
        type: 'professional',
        emailVerified: true,
        emailVerifiedAt: faker.date.past({ years: 1 }),
        lastLoginAt: faker.date.recent({ days: 2 })
      }));
    } else {
      users.push(generateUser());
    }
  }
  
  return users;
}

/**
 * Generate a realistic organization
 */
export function generateOrganization(overwrites: Partial<GeneratedOrganization> = {}): GeneratedOrganization {
  const companyName = faker.company.name();
  const slug = companyName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return {
    name: companyName,
    slug,
    description: faker.company.catchPhrase(),
    website: faker.helpers.arrayElement([
      faker.internet.url(),
      undefined
    ]),
    industry: faker.helpers.arrayElement([
      'Technology',
      'Retail',
      'Manufacturing',
      'Construction',
      'Healthcare',
      'Education',
      'Finance',
      'Real Estate',
      'Consulting'
    ]),
    logo: faker.helpers.arrayElement([
      `https://ui-avatars.com/api/?name=${companyName}&background=random&format=svg`,
      undefined
    ]),
    address: faker.location.streetAddress({ useFullAddress: true }),
    phone: faker.phone.number(),
    vatNumber: faker.helpers.arrayElement([
      `FR${faker.string.numeric(11)}`,
      undefined
    ]),
    ...overwrites
  };
}

/**
 * Generate multiple organizations
 */
export function generateOrganizations(count: number): GeneratedOrganization[] {
  const organizations: GeneratedOrganization[] = [];
  
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // First organization is for testing
      organizations.push(generateOrganization({
        name: 'Test Organization',
        slug: 'test-organization',
        description: 'A test organization for development and testing',
        industry: 'Technology'
      }));
    } else {
      organizations.push(generateOrganization());
    }
  }
  
  return organizations;
}