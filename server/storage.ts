// 
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

  // Cart operations
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(userId: number, productId: number): Promise<boolean>;
  clearCart(userId: number): Promise<boolean>;

  // Order operations
  createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order>;
  getOrders(userId: number): Promise<Order[]>;
  getOrder(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined>;
  updateOrderStatus(orderId: number, status: Order["status"]): Promise<Order | undefined>;

  // Session store
  sessionStore: session.Store;

  // Data seeding
  seedInitialData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
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

  async getProduct(productId: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, productId));
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
    return (result.rowCount ?? 0) > 0;
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
    const [entry] = await db.insert(priceHistory).values(insertPriceHistory).returning();
    return entry;
  }

  // Wishlist operations
  async getWishlists(userId: number): Promise<Wishlist[]> {
    return await db.select().from(wishlists).where(eq(wishlists.userId, userId));
  }

  async getWishlistsWithProducts(userId: number): Promise<(Wishlist & { product: Product })[]> {
    const wishlists = await this.getWishlists(userId);
    return await Promise.all(
      wishlists.map(async (wishlist) => {
        const [product] = await db.select().from(products).where(eq(products.id, wishlist.productId));
        if (!product) throw new Error(`Product not found for wishlist item: ${wishlist.id}`);
        return { ...wishlist, product };
      })
    );
  }

  async addToWishlist(insertWishlist: InsertWishlist): Promise<Wishlist> {
    const [existing] = await db
      .select()
      .from(wishlists)
      .where(
        and(eq(wishlists.userId, insertWishlist.userId), eq(wishlists.productId, insertWishlist.productId))
      );

    if (existing) return existing;

    const [wishlist] = await db.insert(wishlists).values(insertWishlist).returning();
    return wishlist;
  }

  async removeFromWishlist(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Cart operations
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const userCartItems = await db
  .select({
    id: cartItems.id,
    userId: cartItems.userId,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    addedAt: cartItems.addedAt,
    product_id: products.id,
    productName: products.name,
    productDescription: products.description,
    productPrice: products.price,
    productStock: products.stock,
    productImageUrl: products.imageUrl,
    productCategory: products.category,
  })
  .from(cartItems)
  .innerJoin(products, eq(cartItems.productId, products.id))
  .where(eq(cartItems.userId, userId));

return userCartItems.map((item) => ({
  ...item,
  product: {
    id: item.productId,
    name: item.productName,
    description: item.productDescription,
    price: item.productPrice,
    stock: item.productStock,
    imageUrl: item.productImageUrl,
    category: item.productCategory,
  },
}));
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, cartItem.userId), eq(cartItems.productId, cartItem.productId)));

    if (existingItem) {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + (cartItem.quantity ?? 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    }

    const [newItem] = await db.insert(cartItems).values(cartItem).returning();
    return newItem;
  }

  async updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined> {
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      return undefined;
    }

    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .returning();

    return updatedItem;
  }

  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
    return (result.rowCount ??0) > 0;
  }

  async clearCart(userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return (result.rowCount??0) > 0;
  }

  // Order operations
  async createOrder(order: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();

    for (const item of items) {
      await db.insert(orderItems).values({ ...item, orderId: newOrder.id });
      await db
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }

    await this.clearCart(order.userId);
    return newOrder;
  }

  async getOrders(userId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  }

  async getOrder(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) return undefined;
    const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productPrice: products.price,
      productStock: products.stock,
      productImageUrl: products.imageUrl,
      productCategory: products.category,
      quantity: orderItems.quantity,
      price: orderItems.price,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, orderId));
    return {
      ...order,
      items: items.map((item) => ({
        ...item,
        product: {
          id: item.productId,
          name: item.productName,
          description: item.productDescription,
          price: item.productPrice,
          stock: item.productStock,
          imageUrl: item.productImageUrl,
          category: item.productCategory,
        },
      })),
    };
  }

  async updateOrderStatus(orderId: number, status: Order["status"]): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId))
      .returning();
    return updatedOrder;
  }
  
  async seedInitialData(): Promise<void> {
    const adminUser = await this.getUserByUsername("admin");
    if (!adminUser) {
      await this.createUser({
        username: "admin",
        password: "$2b$10$o5r7dLQE9SkP3EoOcXS2lOMtBYBVJaH.9DNMt7UDWGfO7jQyLafVi", // "admin123"
        isAdmin: true,
      });
    }

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