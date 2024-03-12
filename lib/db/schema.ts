import {
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const userSystemEnum = pgEnum("user_system_enum", [
  "system",
  "user_listener",
  "user_questioner",
]);

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  pdfName: text("pdf_name").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  fileKey: text("file_key").notNull(),
});

export type DrizzleChat = typeof chats.$inferSelect;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id")
    .references(() => chats.id)
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: userSystemEnum("role").notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 256 })
    .notNull()
    .unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", {
    length: 256,
  }).unique(),
  stripePriceId: varchar("stripe_price_id", { length: 256 }),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_ended_at"),
});

// New tables start here

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  emailAddress: varchar("email_address", { length: 256 }).notNull(),
  activeChatVersion: integer("active_chat_version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DrizzleUsers = typeof users.$inferSelect;

export const voiceMessages = pgTable("voice_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  role: userSystemEnum("role").notNull(),
  chatVersion: integer("chat_version").notNull().default(1),
});

export type DrizzleVoiceMessage = typeof voiceMessages.$inferSelect;

// drizzle-orm
// drizzle-kit
// npx drizzle-kit push:pg
// npx drizzle-kit studio
