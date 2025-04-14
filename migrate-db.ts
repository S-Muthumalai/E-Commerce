import { db } from './server/db';
import { orders, orderItems, cartItems, orderStatusEnum } from './shared/schema';
import { sql } from 'drizzle-orm';

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Create the order_status enum type if not exists
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
          CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
        END IF;
      END
      $$;
    `);
    console.log('Created order_status enum if it did not exist');
    
    // Create orders table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        total DOUBLE PRECISION NOT NULL,
        status order_status NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        shipping_address TEXT,
        payment_method TEXT,
        tracking_number TEXT
      )
    `);
    console.log('Created orders table if it did not exist');
    
    // Create order_items table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DOUBLE PRECISION NOT NULL
      )
    `);
    console.log('Created order_items table if it did not exist');
    
    // Create cart_items table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created cart_items table if it did not exist');
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Error during migrations:', error);
  } finally {
    process.exit(0);
  }
}

runMigrations();