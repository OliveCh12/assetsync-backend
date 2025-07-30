/**
 * Users Seeder
 * 
 * Seeds the database with test users and organizations
 */

import { eq } from 'drizzle-orm';
import { getDatabase, users, organizations, userOrganizations } from '../../db.js';
import { generateUsers, generateOrganizations } from '../generators/users.js';
import { hashPassword } from '../../auth/passwords.js';

export async function seedUsers(count: number = 10): Promise<{
  userIds: string[];
  organizationIds: string[];
}> {
  console.log('👥 Seeding users...');
  
  const db = getDatabase();
  const userIds: string[] = [];
  const organizationIds: string[] = [];

  try {
    // Generate users with Faker
    const generatedUsers = generateUsers(count);
    
    for (const userData of generatedUsers) {
      // Check if user already exists
      const existing = await db.select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  User '${userData.email}' already exists`);
        userIds.push(existing[0].id);
        continue;
      }

      // Hash the password
      const passwordHash = await hashPassword(userData.passwordHash);

      const [inserted] = await db.insert(users)
        .values({
          ...userData,
          passwordHash
        })
        .returning({ id: users.id });

      userIds.push(inserted.id);
      console.log(`✅ Created user: ${userData.email} (${userData.type})`);
    }

    // Seed organizations for professional users
    console.log('🏢 Seeding organizations...');
    const professionalUsers = await db.select()
      .from(users)
      .where(eq(users.type, 'professional'));

    if (professionalUsers.length > 0) {
      const organizationCount = Math.min(5, Math.ceil(professionalUsers.length / 2));
      const generatedOrgs = generateOrganizations(organizationCount);

      for (const orgData of generatedOrgs) {
        // Check if organization already exists
        const existing = await db.select()
          .from(organizations)
          .where(eq(organizations.slug, orgData.slug))
          .limit(1);

        if (existing.length > 0) {
          console.log(`⏭️  Organization '${orgData.name}' already exists`);
          organizationIds.push(existing[0].id);
          continue;
        }

        const [inserted] = await db.insert(organizations)
          .values(orgData)
          .returning({ id: organizations.id });

        organizationIds.push(inserted.id);
        console.log(`✅ Created organization: ${orgData.name}`);
      }

      // Assign professional users to organizations
      console.log('🔗 Linking users to organizations...');
      
      for (let i = 0; i < professionalUsers.length; i++) {
        const user = professionalUsers[i];
        const orgId = organizationIds[i % organizationIds.length];
        
        // Check if relationship already exists
        const existingRelation = await db.select()
          .from(userOrganizations)
          .where(eq(userOrganizations.userId, user.id))
          .limit(1);

        if (existingRelation.length > 0) {
          console.log(`⏭️  User-organization relationship already exists for ${user.email}`);
          continue;
        }

        await db.insert(userOrganizations)
          .values({
            userId: user.id,
            organizationId: orgId,
            role: i === 0 ? 'owner' : 'admin', // First user is owner, others are admins
            joinedAt: new Date(),
            isActive: true
          });

        console.log(`✅ Linked user ${user.email} to organization`);
      }
    }

    console.log(`🎉 Successfully seeded ${userIds.length} users and ${organizationIds.length} organizations`);
    return { userIds, organizationIds };

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}