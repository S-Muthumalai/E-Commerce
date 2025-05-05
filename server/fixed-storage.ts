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
  updateUser(userId: number,username:string, phone: string,email: string): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  // getAllUsersWithDetails(): Promise<(User & { wishlistCount: number, cartItemCount: number })[]>;
  getUserWithDetails(id: number): Promise<( { wishlistCount: number, cartItemCount: number ,numberOfOrder:number}) | undefined>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  
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
  getAllOrdersWithDetails(): Promise<Order[]>;
  deleteOrder(orderId: number): Promise<boolean>;
  getApprovedOrders(user_id:number): Promise<Order[]>;
  assignOrderToMiddleman(orderId: number): Promise<void>;
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
  async getAllUsers(): Promise<User[]> {
    const users1=await db.select().from(users);
    return  users1;
  }

  async getUserWithDetails(id: number): Promise<( { wishlistCount: number; cartItemCount: number; numberOfOrder: number; }) | undefined> {
    // const [user] = await db.select().from(users).where(eq(users.id, id));

    // if (!user) {
    //   return undefined;
    // }

    const [wishlistCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(wishlists)
      .where(eq(wishlists.userId, id));

    const [cartItemCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cartItems)
      .where(eq(cartItems.userId, id));

    const [numberOfOrder] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.userId, id));

    return {
      // ...user,
      wishlistCount: wishlistCount?.count || 0,
      cartItemCount: cartItemCount?.count || 0,
      numberOfOrder: numberOfOrder?.count || 0,
    };
  }
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result !== null;
  }

  async updateUser(userId: number, username: string, phone: string, email: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ username, phone, email })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
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
  
  // async updateUser(userId: number, username: string, phone: string, email: string): Promise<User | undefined> {
  //   const [updatedUser] = await db
  //     .update(users)
  //     .set({ email, phone, username })
  //     .where(eq(users.id, userId))
  //     .returning();
  //   return updatedUser;
  // }
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }
  async getProduct(id: number): Promise<Product | undefined> {
    if(!id||id<=0){
      throw new Error("Invalid product ID");
    }
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async getAllProducts(): Promise<Product[]> {
    try {
        const products1 = await db.select().from(products); // Replace `productsTable` with your actual table name
        return products1;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
    }
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
  
  // Cart operations
  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    const userCartItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
      
    const result: (CartItem & { product: Product })[] = [];
    
    for (const cartItem of userCartItems) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, cartItem.productId));
      
      if (product) {
        result.push({
          ...cartItem,
          product,
        });
      }
    }
    
    return result;
  }
  
  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if product is already in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, insertCartItem.userId),
          eq(cartItems.productId, insertCartItem.productId)
        )
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
    const [cartItem] = await db
      .insert(cartItems)
      .values(insertCartItem)
      .returning();
    
    return cartItem;
  }
  
  async updateCartItemQuantity(userId: number, productId: number, quantity: number): Promise<CartItem | undefined> {
    // If quantity is 0 or less, remove the item
    if (quantity <= 0) {
      await this.removeFromCart(userId, productId);
      return undefined;
    }
    
    // Update the quantity
    const [updatedCartItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      )
      .returning();
    
    return updatedCartItem;
  }
  
  async removeFromCart(userId: number, productId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.userId, userId),
          eq(cartItems.productId, productId)
        )
      );
    
    return result !== null;
  }
  
  async clearCart(userId: number): Promise<boolean> {
    const result = await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
    
    return result !== null;
  }
  async getOrderById(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));

    if (!order) {
      return undefined;
    }

    const orderItemsList = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    const items: (OrderItem & { product: Product })[] = [];

    for (const item of orderItemsList) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

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
  
  async getOrdersByUser(userId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] })[]> {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(sql`${orders.createdAt} DESC`);
    
    const result: (Order & { items: (OrderItem & { product: Product })[] })[] = [];
    
    for (const order of userOrders) {
      const orderItemList = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      
      const items: (OrderItem & { product: Product })[] = [];
      
      for (const item of orderItemList) {
        const [product] = await db
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        if (product) {
          items.push({
            ...item,
            product,
          });
        }
      }
      
      result.push({
        ...order,
        items,
      });
    }
    
    return result;
  }

  // Order operations

    async createOrder(orderData: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order> {
      return await db.transaction(async (tx) => {
        const deliveryDate =new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now
        // Insert the order
        const [order] = await tx.insert(orders).values({
          userId: orderData.userId,
            total: orderData.total,
            shippingAddress: orderData.shippingAddress,
            trackingNumber: orderData.trackingNumber,
            deliveryDate, // Assuming you have a function to calculate delivery date
        }).returning();
  
        // Insert the order items and update product stock
        for (const item of items) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          });
  
          // Update product stock
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
  
        // Clear the user's cart
        await tx.delete(cartItems).where(eq(cartItems.userId, orderData.userId));
  
        return order;
      });
    }

    async createOrderone(orderData: InsertOrder, items: Omit<InsertOrderItem, "orderId">[]): Promise<Order> {
      return await db.transaction(async (tx) => {
        // Insert the order
        const deliveryDate = orderData.deliveryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now
        const [order] = await tx.insert(orders).values({
          userId: orderData.userId,
            total: orderData.total,
            shippingAddress: orderData.shippingAddress,
            deliveryDate, 
            trackingNumber: orderData.trackingNumber,
        }).returning();
        // Insert the order items and update product stock
        for (const item of items) {
          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          });
  
          // Update product stock
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(eq(products.id, item.productId));
        }
  
        // Clear the user's cart
        return order;
      });
    }

  async getOrders(userId: number): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(sql`${orders.createdAt} DESC`);
  }
  
  async getOrder(orderId: number): Promise<(Order & { items: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId));
    
    if (!order) {
      return undefined;
    }
    
    const orderItemList = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
      
    const items: (OrderItem & { product: Product })[] = [];
    
    for (const item of orderItemList) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));
        
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

  async getAllOrdersWithDetails(): Promise<(Order & { 
    items: (OrderItem & { product: Product })[], 
    user: { username: string } 
})[]> {
    // Fetch all orders with user details
    const allOrders = await db
        .select({
            id: orders.id,
            userId: orders.userId,
            status: orders.status,
            createdAt: orders.createdAt,
            deliveryDate: orders.deliveryDate,
            shippingAddress: orders.shippingAddress,
            trackingNumber: orders.trackingNumber,
            total: orders.total,
            updatedAt: orders.updatedAt,
            middlemanId: orders.middlemanId,
            username: users.username, // Include the username from the users table
        })
        .from(orders)
        .innerJoin(users, eq(orders.userId, users.id)) // Join with users table
        .orderBy(sql`${orders.createdAt} DESC`); // Order by creation date

    const result: (Order & { 
        items: (OrderItem & { product: Product })[], 
        user: { username: string } 
    })[] = [];

    // Loop through each order to fetch its items and product details
    for (const order of allOrders) {
        const orderItemsList = await db
            .select({
                id: orderItems.id,
                orderId: orderItems.orderId,
                productId: orderItems.productId,
                quantity: orderItems.quantity,
                price: orderItems.price,
                productName: products.name, // Include product name
                productPrice: products.price, // Include product price
                productDescription: products.description, // Include product description
                productStock: products.stock, // Include product stock
                productImageUrl: products.imageUrl, // Include product image URL
                productCategory: products.category, // Include product category
            })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id)) // Join with products table
            .where(eq(orderItems.orderId, order.id)); // Filter by order ID

        // Map the order items to include product details
        const items: (OrderItem & { product: Product })[] = orderItemsList.map(item => ({
            id: item.id,
            orderId: item.orderId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
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

        // Push the order with its items and user details to the result array
        result.push({
            ...order,
            items,
            user: { username: order.username }, // Replace with actual total calculation if available
            shippingAddress: order.shippingAddress || null, // Replace with actual shipping address if available
            total:order.total, // Replace with actual shipping address if available
            deliveryDate: order.deliveryDate, 
            trackingNumber: order.trackingNumber, 
            middlemanId: order.middlemanId,
        });
    }
    return result;
}
async updateOrderStatus(orderId: number, status: Order['status']): Promise<Order | undefined> {
  const [updatedOrder] = await db
      .update(orders)
      .set({ 
          status:status,
          updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();
  return updatedOrder;
}
async getApprovedOrders( user_id:number): Promise<Order[]> {
  return await db
      .select()
      .from(orders)
      .where(eq(orders.middlemanId, user_id)) // Replace 'pending' with a valid enum value or update the enum definition
      .orderBy(sql`${orders.createdAt} DESC`);
}
async deleteOrder(orderId: number): Promise<boolean> {
  const result = await db
      .delete(orders)
      .where(eq(orders.id, orderId));
  return result !== null;
}

async assignOrderToMiddleman(orderId: number): Promise<void> {
  const [middleman] = await db
      .select()
      .from(users)
      .where(eq(users.isMiddleman, true)) // Assuming 'middleman' is a role in the users table
      .limit(1);

  if (middleman) {
      await db
          .update(orders)
          .set({ middlemanId: middleman.id }) // Assuming `middlemanId` exists in the orders table
          .where(eq(orders.id, orderId));
  } else {
      throw new Error('No available middleman found');
  }
}
  // Seed initial data function that can be called after DB setup
  async seedInitialData() {
    // Check if admin user exists
    const adminUser = await this.getUserByUsername("admin");
    
    if (!adminUser) {
      // Create default admin user
      await this.createUser({
        username: "admin",
        password: "admin123",
        email: "smuthumalai2@gmail.com",
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
        }, {
          name: "Smartphone",
          description: "Latest smartphone with a high-resolution display and powerful processor.",
          price: 699.99,
          stock: 50,
          imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
          category: "Electronics",
        },
        {
          name: "Bluetooth Speaker",
          description: "Portable Bluetooth speaker with deep bass and long battery life.",
          price: 49.99,
          stock: 120,
          imageUrl: "https://images.unsplash.com/photo-1512499617640-c2f999018b72",
          category: "Electronics",
        },
        {
          name: "Office Chair",
          description: "Ergonomic office chair with adjustable height and lumbar support.",
          price: 199.99,
          stock: 30,
          imageUrl: "https://images.unsplash.com/photo-1578898884382-825d6a5d9b1b",
          category: "Furniture",
        },
        {
          name: "Coffee Maker",
          description: "Automatic coffee maker with programmable settings and a built-in grinder.",
          price: 89.99,
          stock: 40,
          imageUrl: "https://images.unsplash.com/photo-1511920170033-f8396924c348",
          category: "Home Appliances",
        },
        {
          name: "Yoga Mat",
          description: "Non-slip yoga mat with extra cushioning for comfort.",
          price: 29.99,
          stock: 100,
          imageUrl: "https://images.unsplash.com/photo-1599058917211-0c5e7a6f6c9e",
          category: "Sports",
        },
        {
          name: "Laptop",
          description: "High-performance laptop with a sleek design and long battery life.",
          price: 999.99,
          stock: 25,
          imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
          category: "Electronics",
        },
        {
          name: "Electric Kettle",
          description: "Fast-boiling electric kettle with temperature control.",
          price: 39.99,
          stock: 60,
          imageUrl: "https://images.unsplash.com/photo-1601047023475-6a4f7d2c6e4b",
          category: "Home Appliances",
        },
        {
          name: "Backpack",
          description: "Durable backpack with multiple compartments for travel and work.",
          price: 59.99,
          stock: 80,
          imageUrl: "https://images.unsplash.com/photo-1522199755839-a2bacb67c546",
          category: "Accessories",
        },
        {
          name: "Desk Lamp",
          description: "LED desk lamp with adjustable brightness and color temperature.",
          price: 24.99,
          stock: 70,
          imageUrl: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2",
          category: "Furniture",
        },
        {
          name: "Wireless Keyboard",
          description: "Compact wireless keyboard with a sleek design and long battery life.",
          price: 34.99,
          stock: 90,
          imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8",
          category: "Electronics",
        },
      ];
      
      for (const product of sampleProducts) {
        await this.createProduct(product);
      }
    }
  }
}

export const storage = new DatabaseStorage();