import { users, type User, type InsertUser, products, type Product, type InsertProduct, priceHistory, type PriceHistory, type InsertPriceHistory, wishlists, type Wishlist, type InsertWishlist } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEmail(userId: number, email: string): Promise<User | undefined>;
  
  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Price history operations
  getPriceHistory(productId: number): Promise<PriceHistory[]>;
  createPriceHistory(priceHistory: InsertPriceHistory): Promise<PriceHistory>;
  
  // Wishlist operations
  getWishlists(userId: number): Promise<Wishlist[]>;
  getWishlistsWithProducts(userId: number): Promise<(Wishlist & { product: Product })[]>;
  addToWishlist(wishlist: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(userId: number, productId: number): Promise<boolean>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUserEmail(userId: number, email: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ email })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    
    // Create initial price history entry
    await this.createPriceHistory({
      productId: product.id,
      price: insertProduct.price,
      date: new Date(),
    });
    
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [existingProduct] = await db.select().from(products).where(eq(products.id, id));
    
    if (!existingProduct) {
      return undefined;
    }
    
    // Check if price is being updated
    if (updateData.price !== undefined && updateData.price !== existingProduct.price) {
      // Create price history entry
      await this.createPriceHistory({
        productId: id,
        price: updateData.price,
        date: new Date(),
      });
    }
    
    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result !== null;
  }

  // Price history operations
  async getPriceHistory(productId: number): Promise<PriceHistory[]> {
    return await db
      .select()
      .from(priceHistory)
      .where(eq(priceHistory.productId, productId))
      .orderBy(priceHistory.date);
  }

  async createPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const [entry] = await db
      .insert(priceHistory)
      .values(insertPriceHistory)
      .returning();
    
    return entry;
  }

  // Wishlist operations
  async getWishlists(userId: number): Promise<Wishlist[]> {
    return await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, userId));
  }

  async getWishlistsWithProducts(userId: number): Promise<(Wishlist & { product: Product })[]> {
    const userWishlists = await this.getWishlists(userId);
    const result: (Wishlist & { product: Product })[] = [];
    
    for (const wishlist of userWishlists) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, wishlist.productId));
      
      if (product) {
        result.push({
          ...wishlist,
          product,
        });
      }
    }
    
    return result;
  }

  async addToWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    // Check if entry already exists
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, insertWishlist.userId),
          eq(wishlists.productId, insertWishlist.productId)
        )
      );
    
    if (existing) {
      return existing;
    }
    
    const [wishlist] = await db
      .insert(wishlists)
      .values(insertWishlist)
      .returning();
    
    return wishlist;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userId, userId),
          eq(wishlists.productId, productId)
        )
      );
    
    return result !== null;
  }
  
  // Seed initial data function that can be called after DB setup
  async seedInitialData() {
    // Check if admin user exists
    const adminUser = await this.getUserByUsername("admin");
    
    if (!adminUser) {
      // Create default admin user
      await this.createUser({
        username: "admin",
        password: "$2b$10$o5r7dLQE9SkP3EoOcXS2lOMtBYBVJaH.9DNMt7UDWGfO7jQyLafVi", // "admin123"
        isAdmin: true,
      });
    }
    
    // Check if products exist
    const existingProducts = await this.getProducts();
    
    if (existingProducts.length === 0) {
      const sampleProducts: InsertProduct[] = [
        {
          name: "Wireless Headphones",
          description: "High-quality wireless headphones with noise cancellation and 20-hour battery life.",
          price: 129.99,
          stock: 45,
          imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
          category: "Electronics",
        },
        {
          name: "Running Shoes",
          description: "Lightweight running shoes with comfortable cushioning.",
          price: 89.99,
          stock: 23,
          imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
          category: "Sports",
        },
        {
          name: "Fitness Tracker",
          description: "Track your activity, sleep, and heart rate.",
          price: 59.99,
          stock: 78,
          imageUrl: "https://images.unsplash.com/photo-1585155770447-2f66e2a397b5",
          category: "Electronics",
        },
        {
          name: "Gaming Mouse",
          description: "High-precision gaming mouse with customizable RGB lighting.",
          price: 45.99,
          stock: 0,
          imageUrl: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3",
          category: "Electronics",
        },
        {
          name: "Casual Sneakers",
          description: "Stylish casual sneakers for everyday wear.",
          price: 79.99,
          stock: 32,
          imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
          category: "Clothing",
        },
      ];
      
      for (const product of sampleProducts) {
        await this.createProduct(product);
      }
    }
  }
}

export const storage = new DatabaseStorage();