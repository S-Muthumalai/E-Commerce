import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage } from "./fixed-storage";
import { User as SelectUser } from "@shared/schema";
import { is } from "drizzle-orm";
// import { verifyIdToken } from "./verify-id-token";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "ecommerce-product-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        console.log("User found:", user);
        console.log("Password supplied:", password);
        console.log("Stored password:", user?.password);
        console.log("Password match:", password === user?.password);
        if (!user || !(password === user.password)) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // User registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Creating user with data:", req.body.username, req.body.password, req.body.phone);
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }
      const user = await storage.createUser({
        ...req.body,
        password: (req.body.password),
        phone: (req.body.phone),
        isAdmin: false,
        isMiddleman: false,
      });
      console.log("User created:", user),

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({
          id: user.id,
          username: user.username,
          isAdmin: user.isAdmin,
          isMiddleman: user.isMiddleman,
        });
      });
    } catch (err) {
      next(err);
    }
  });

  // User login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate(
      "local", 
      (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (err: Error | null) => {
        if (err) return next(err);
        console.log("User logged in:", user);
        return res.status(200).json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        isMiddleman: user.isMiddleman,
        });
      });
      }
    )(req, res, next);
  });
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = req.user;
    res.json({
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      isMiddleman: user.isMiddleman,
    });
  });
}
