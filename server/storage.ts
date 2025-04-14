import { users, type User, type InsertUser, products, type Product, type InsertProduct, priceHistory, type PriceHistory, type InsertPriceHistory, wishlists, type Wishlist, type InsertWishlist } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private priceHistories: Map<number, PriceHistory>;
  private wishlists: Map<number, Wishlist>;
  private userIdCounter: number;
  private productIdCounter: number;
  private priceHistoryIdCounter: number;
  private wishlistIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.priceHistories = new Map();
    this.wishlists = new Map();
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.priceHistoryIdCounter = 1;
    this.wishlistIdCounter = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24h
    });
    
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$o5r7dLQE9SkP3EoOcXS2lOMtBYBVJaH.9DNMt7UDWGfO7jQyLafVi", // "admin123"
      isAdmin: true,
    });
    
    // Create some sample products
    this.initSampleProducts();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    
    // Create initial price history entry
    await this.createPriceHistory({
      productId: id,
      price: insertProduct.price,
      date: new Date(),
    });
    
    return product;
  }

  async updateProduct(id: number, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    
    if (!product) {
      return undefined;
    }
    
    // Check if price is being updated
    if (updateData.price !== undefined && updateData.price !== product.price) {
      // Create price history entry
      await this.createPriceHistory({
        productId: id,
        price: updateData.price,
        date: new Date(),
      });
    }
    
    const updatedProduct = { ...product, ...updateData };
    this.products.set(id, updatedProduct);
    
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Price history operations
  async getPriceHistory(productId: number): Promise<PriceHistory[]> {
    return Array.from(this.priceHistories.values())
      .filter(history => history.productId === productId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createPriceHistory(insertPriceHistory: InsertPriceHistory): Promise<PriceHistory> {
    const id = this.priceHistoryIdCounter++;
    const priceHistoryEntry: PriceHistory = { ...insertPriceHistory, id };
    this.priceHistories.set(id, priceHistoryEntry);
    return priceHistoryEntry;
  }

  // Wishlist operations
  async getWishlists(userId: number): Promise<Wishlist[]> {
    return Array.from(this.wishlists.values())
      .filter(wishlist => wishlist.userId === userId);
  }

  async getWishlistsWithProducts(userId: number): Promise<(Wishlist & { product: Product })[]> {
    const userWishlists = await this.getWishlists(userId);
    
    return userWishlists.map(wishlist => {
      const product = this.products.get(wishlist.productId);
      if (!product) {
        throw new Error(`Product not found for wishlist item: ${wishlist.id}`);
      }
      
      return {
        ...wishlist,
        product,
      };
    });
  }

  async addToWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    // Check if entry already exists
    const existing = Array.from(this.wishlists.values()).find(
      w => w.userId === insertWishlist.userId && w.productId === insertWishlist.productId
    );
    
    if (existing) {
      return existing;
    }
    
    const id = this.wishlistIdCounter++;
    const wishlist: Wishlist = { ...insertWishlist, id };
    this.wishlists.set(id, wishlist);
    return wishlist;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    const wishlist = Array.from(this.wishlists.values()).find(
      w => w.userId === userId && w.productId === productId
    );
    
    if (!wishlist) {
      return false;
    }
    
    return this.wishlists.delete(wishlist.id);
  }

  // Initialize sample products
  private async initSampleProducts() {
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

export const storage = new MemStorage();
