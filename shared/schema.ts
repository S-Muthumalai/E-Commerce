import { pgTable, text, integer, boolean, doublePrecision, timestamp, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { relations } from "drizzle-orm";
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isMiddleman: boolean("is_middlman").notNull().default(false),
});
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  phone: true,
  email: true, 
  isAdmin: true,
});
export const products = pgTable("products", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  stock: integer("stock").notNull().default(0),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
});
export const insertProductSchema = createInsertSchema(products).pick({
  id: true,
  name: true,
  description: true,
  price: true,
  stock: true,
  imageUrl: true,
  category: true,
});
export const priceHistory = pgTable("price_history", {
  id: integer("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  price: doublePrecision("price").notNull(),
  date: timestamp("date").notNull().defaultNow(),
});
export const insertPriceHistorySchema = createInsertSchema(priceHistory).pick({
  productId: true,
  price: true,
  date: true,
});
export const wishlists = pgTable("wishlists", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
});
export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  productId: true,
});
export const orderStatusEnum = pgEnum('order_status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled']);
export const orders = pgTable("orders", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  total: doublePrecision("total").notNull(),
  status: orderStatusEnum("status").default('pending').notNull(),
  createdAt: timestamp("create_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  shippingAddress: text("shipping_address"),
  deliveryDate: timestamp("delivery_date").notNull(),
  middlemanId: integer("middleman_id").references(() => users.id),
  trackingNumber: text("payment_tracking_number").notNull(),
});
export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  total: true,
  status: true,
  shippingAddress: true,
  middlemanId: true,
  deliveryDate: true,
  trackingNumber: true,
});
export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: doublePrecision("price").notNull(), // Price at time of purchase
});
export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
});
export const cartItems = pgTable("cart_items", {
  id: integer("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});
export const insertCartItemSchema = createInsertSchema(cartItems).pick({
  userId: true,
  productId: true,
  quantity: true,
});
export const usersRelations = relations(users, ({ many }) => ({
  wishlists: many(wishlists),
  orders: many(orders),
  cartItems: many(cartItems),
}));
export const productsRelations = relations(products, ({ many }) => ({
  priceHistory: many(priceHistory),
  wishlists: many(wishlists),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));
export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, {
    fields: [priceHistory.productId],
    references: [products.id],
  }),
}));
export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertPriceHistory = z.infer<typeof insertPriceHistorySchema>;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type ProductWithPriceHistory = Product & {
  priceHistory: PriceHistory[];
};
export type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[];
};
export type CartItemWithProduct = CartItem & {
  product: Product;
};