import { 
  users, type User, type InsertUser, 
  products, type Product, type InsertProduct, 
  priceHistory, type PriceHistory, type InsertPriceHistory, 
  wishlists, type Wishlist, type InsertWishlist,
  cartItems, type CartItem, type InsertCartItem,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserEmail?(userId: number, email: string): Promise<User | undefined>;
  
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
  
  // Cart operations
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(userId: number, productId: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;
  
  // Order operations
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order>;
  getOrders(userId: number): Promise<Order[]>;
  getOrder(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  updateOrderStatus(orderId: number, status: Order['status']): Promise<Order | undefined>;
  
  // Session store
  sessionStore: session.Store;
  
  // Data seeding
  seedInitialData?(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private priceHistories: Map<number, PriceHistory>;
  private wishlists: Map<number, Wishlist>;
  private cartItems: Map<number, CartItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private userIdCounter: number;
  private productIdCounter: number;
  private priceHistoryIdCounter: number;
  private wishlistIdCounter: number;
  private cartItemIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.priceHistories = new Map();
    this.wishlists = new Map();
    this.cartItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.userIdCounter = 1;
    this.productIdCounter = 1;
    this.priceHistoryIdCounter = 1;
    this.wishlistIdCounter = 1;
    this.cartItemIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
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

  // Cart operations
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const userCartItems = Array.from(this.cartItems.values())
      .filter(cartItem => cartItem.userId === userId);
    
    return userCartItems.map(cartItem => {
      const product = this.products.get(cartItem.productId);
      if (!product) {
        throw new Error(`Product not found for cart item: ${cartItem.id}`);
      }
      
      return {
        ...cartItem,
        product,
      };
    });
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if product is already in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      item => item.userId === insertCartItem.userId && item.productId === insertCartItem.productId
    );
    
    if (existingItem) {
      // If it exists, update the quantity
      return await this.updateCartItemQuantity(
        insertCartItem.userId,
        insertCartItem.productId,
        existingItem.quantity + (insertCartItem.quantity || 1)
      ) as CartItem;
    }
    
    // Otherwise insert a new item
    const id = this.cartItemIdCounter++;
    const now = new Date();
    const cartItem: CartItem = { 
      ...insertCartItem, 
      id,
      quantity: insertCartItem.quantity || 1,
      addedAt: now
    };
    
    this.cartItems.set(id, cartItem);
    return cartItem;
  }
  
  async updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined> {
    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      return undefined;
    }
    
    // Find the cart item
    const cartItem = Array.from(this.cartItems.values()).find(
      item => item.userId === userId && item.productId === productId
    );
    
    if (!cartItem) {
      return undefined;
    }
    
    // Update the quantity
    const updatedCartItem: CartItem = {
      ...cartItem,
      quantity
    };
    
    this.cartItems.set(cartItem.id, updatedCartItem);
    return updatedCartItem;
  }
  
  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const cartItem = Array.from(this.cartItems.values()).find(
      item => item.userId === userId && item.productId === productId
    );
    
    if (!cartItem) {
      return false;
    }
    
    return this.cartItems.delete(cartItem.id);
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const userCartItems = Array.from(this.cartItems.values())
      .filter(item => item.userId === userId);
    
    for (const item of userCartItems) {
      this.cartItems.delete(item.id);
    }
    
    return true;
  }
  
  // Order operations
  async createOrder(orderData: InsertOrder, items: Omit<InsertOrderItem, 'orderId'>[]): Promise<Order> {
    // Create the order
    const id = this.orderIdCounter++;
    const now = new Date();
    const order: Order = {
      ...orderData,
      id,
      createdAt: now,
      updatedAt: now,
      status: orderData.status || 'pending',
    };
    
    this.orders.set(id, order);
    
    // Add all the order items
    for (const item of items) {
      const orderItemId = this.orderItemIdCounter++;
      const orderItem: OrderItem = {
        id: orderItemId,
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      };
      
      this.orderItems.set(orderItemId, orderItem);
      
      // Update product stock
      const product = this.products.get(item.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        this.products.set(product.id, {
          ...product,
          stock: newStock,
        });
      }
    }
    
    // Clear the user's cart
    await this.clearCart(orderData.userId);
    
    return order;
  }
  
  async getOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  async getOrder(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const order = this.orders.get(orderId);
    
    if (!order) {
      return undefined;
    }
    
    const orderItemList = Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
      
    const items: (OrderItem & { product: Product })[] = [];
    
    for (const item of orderItemList) {
      const product = this.products.get(item.productId);
      if (product) {
        items.push({
          ...item,
          product,
        });
      }
    }
    
    return {
      ...order,
      items,
    };
  }
  
  async updateOrderStatus(orderId: number, status: Order['status']): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    
    if (!order) {
      return undefined;
    }
    
    const updatedOrder: Order = {
      ...order,
      status,
      updatedAt: new Date(),
    };
    
    this.orders.set(orderId, updatedOrder);
    return updatedOrder;
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

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

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
    return result.count > 0;
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
    
    return result.count > 0;
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
