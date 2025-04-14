import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./fixed-storage";
import { insertProductSchema } from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is admin
function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all products (public)
  app.get("/api/products", async (req, res, next) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (err) {
      next(err);
    }
  });

  // Get a specific product (public)
  app.get("/api/products/:id", async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id, 10);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (err) {
      next(err);
    }
  });

  // Create a new product (admin only)
  app.post("/api/products", isAdmin, async (req, res, next) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: err.errors 
        });
      }
      next(err);
    }
  });

  // Update a product (admin only)
  app.put("/api/products/:id", isAdmin, async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id, 10);
      const validatedData = insertProductSchema.partial().parse(req.body);
      
      // Check if price is being updated
      if (validatedData.price !== undefined) {
        // Get current product to compare prices
        const currentProduct = await storage.getProduct(productId);
        
        if (currentProduct && validatedData.price !== currentProduct.price) {
          // Record the price change in price history
          await storage.createPriceHistory({
            productId,
            price: validatedData.price,
            date: new Date()
          });
          
          // Check if this is a price drop and notify users
          if (validatedData.price < currentProduct.price) {
            // Import dynamically to avoid circular dependency
            const { checkPriceDropAndNotify } = await import('./email-service');
            checkPriceDropAndNotify(productId, validatedData.price);
          }
        }
      }
      
      const updatedProduct = await storage.updateProduct(productId, validatedData);
      
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid product data", 
          errors: err.errors 
        });
      }
      next(err);
    }
  });

  // Delete a product (admin only)
  app.delete("/api/products/:id", isAdmin, async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id, 10);
      const success = await storage.deleteProduct(productId);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // Get price history for a product
  app.get("/api/products/:id/price-history", async (req, res, next) => {
    try {
      const productId = parseInt(req.params.id, 10);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const priceHistory = await storage.getPriceHistory(productId);
      res.json(priceHistory);
    } catch (err) {
      next(err);
    }
  });

  // Add product to wishlist
  app.post("/api/wishlist", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }
      
      const product = await storage.getProduct(parseInt(productId, 10));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const wishlist = await storage.addToWishlist({
        userId: req.user.id,
        productId: parseInt(productId, 10)
      });
      
      res.status(201).json(wishlist);
    } catch (err) {
      next(err);
    }
  });

  // Get user's wishlist
  app.get("/api/wishlist", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const wishlist = await storage.getWishlistsWithProducts(req.user.id);
      res.json(wishlist);
    } catch (err) {
      next(err);
    }
  });

  // Remove product from wishlist
  app.delete("/api/wishlist/:productId", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const productId = parseInt(req.params.productId, 10);
      const success = await storage.removeFromWishlist(req.user.id, productId);
      
      if (!success) {
        return res.status(404).json({ message: "Product not in wishlist" });
      }
      
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });
  
  // Update user's email preferences
  app.put("/api/user/email", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Update user email in database
      const updatedUser = await storage.updateUserEmail(req.user.id, email);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isAdmin: updatedUser.isAdmin
      });
    } catch (err) {
      next(err);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
