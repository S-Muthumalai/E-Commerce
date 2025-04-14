import nodemailer from "nodemailer";
import { storage } from "./fixed-storage";
import { Product, PriceHistory, User, wishlists } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: parseInt(process.env.EMAIL_PORT || "587", 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },
});

/**
 * Sends a price drop notification email to a user
 * @param user The user to notify
 * @param product The product with the price drop
 * @param oldPrice The previous price
 * @param newPrice The new price
 */
export async function sendPriceDropNotification(
  user: User,
  product: Product,
  oldPrice: number,
  newPrice: number
) {
  // Calculate price difference and percentage
  const priceDifference = oldPrice - newPrice;
  const percentageChange = ((priceDifference / oldPrice) * 100).toFixed(2);

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@example.com",
      to: user.email || user.username,
      subject: `Price Drop Alert: ${product.name}`,
      html: `
        <h1>Price Drop Alert!</h1>
        <p>Good news! A product on your wishlist has dropped in price.</p>
        
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 15px 0;">
          <h2>${product.name}</h2>
          <p>${product.description || ""}</p>
          <p>
            <span style="text-decoration: line-through; color: #999;">$${oldPrice.toFixed(2)}</span>
            <span style="color: green; font-weight: bold; font-size: 1.2em; margin-left: 10px;">$${newPrice.toFixed(2)}</span>
          </p>
          <p>You saved: <strong>$${priceDifference.toFixed(2)} (${percentageChange}%)</strong></p>
          <a href="${process.env.APP_URL || "http://localhost:5000"}/products/${product.id}" style="display: inline-block; padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">View Product</a>
        </div>
        
        <p>Happy shopping!</p>
      `,
    });
    console.log(`Price drop notification sent to ${user.username} for ${product.name}`);
  } catch (error) {
    console.error("Failed to send email notification:", error);
  }
}

/**
 * Checks for price drops and notifies users with the product in their wishlist
 * @param productId The ID of the product to check
 * @param newPrice The new price of the product
 */
export async function checkPriceDropAndNotify(productId: number, newPrice: number) {
  try {
    // Get product price history
    const priceHistory = await storage.getPriceHistory(productId);
    
    // We need at least 2 price points to detect a price drop
    if (priceHistory.length < 2) return;
    
    // Get the two most recent price entries
    const sortedHistory = [...priceHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const latestPrice = sortedHistory[0].price;
    const previousPrice = sortedHistory[1].price;
    
    // If there's a price drop
    if (latestPrice < previousPrice) {
      // Get the product
      const product = await storage.getProduct(productId);
      if (!product) return;
      
      // Find users who have this product in their wishlist
      const usersWithProductInWishlist = await getUsersWithProductInWishlist(productId);
      
      // Send notification to each user
      for (const user of usersWithProductInWishlist) {
        await sendPriceDropNotification(user, product, previousPrice, latestPrice);
      }
    }
  } catch (error) {
    console.error(`Failed to check price drop for product ${productId}:`, error);
  }
}

/**
 * Gets all users who have a specific product in their wishlist
 * @param productId The ID of the product to check
 * @returns An array of users
 */
async function getUsersWithProductInWishlist(productId: number): Promise<User[]> {
  // Get all wishlists for this product
  const userIds: number[] = [];
  const users: User[] = [];
  
  // Find all wishlists containing the product
  const wishlistItems = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.productId, productId));
  
  // Get unique user IDs from the wishlists
  for (const wishlist of wishlistItems) {
    if (!userIds.includes(wishlist.userId)) {
      userIds.push(wishlist.userId);
    }
  }
  
  // Get user details for each user ID
  for (const userId of userIds) {
    const user = await storage.getUser(userId);
    if (user) {
      users.push(user);
    }
  }
  
  return users;
}