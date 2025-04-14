import { db } from './server/db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { users } from './shared/schema';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.username, 'admin'),
    });

    const hashedPassword = await hashPassword('Muthu007@');

    if (existingAdmin) {
      // Update existing admin
      await db.update(users)
        .set({ 
          isAdmin: true,
          email: 's.muthumalai007@gmail.com',
          password: hashedPassword
        })
        .where(eq(users.username, 'admin'))
        .returning();
      
      console.log('Admin user updated successfully');
    } else {
      // Create new admin user
      await db.insert(users).values({
        username: 'admin',
        password: hashedPassword,
        email: 's.muthumalai007@gmail.com',
        isAdmin: true
      }).returning();

      console.log('Admin user created successfully');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();