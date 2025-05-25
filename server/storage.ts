import { users, type User, type InsertUser, feeDiscounts, type FeeDiscount, feeSettings, type FeeSettings } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Interface voor storage operaties
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getFeeDiscounts(): Promise<FeeDiscount[]>;
  getFeeSettings(): Promise<FeeSettings[]>;
}

// DatabaseStorage implementatie die gebruik maakt van de database
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async getFeeDiscounts(): Promise<FeeDiscount[]> {
    return await db.select().from(feeDiscounts);
  }
  
  async getFeeSettings(): Promise<FeeSettings[]> {
    return await db.select().from(feeSettings);
  }
}

export const storage = new DatabaseStorage();