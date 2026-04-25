import { relations } from "drizzle-orm";
import {
  pgTable, text, timestamp, boolean, index,
  integer, bigint, jsonb, uniqueIndex, smallint,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// ─── Game tables ──────────────────────────────────────────────────────────────

export type SpeedChange = { afterStimulusIndex: number; newIntervalMs: number };

export const game = pgTable(
  "game",
  {
    id: text("id").primaryKey(),
    hostId: text("host_id").notNull().references(() => user.id),
    status: text("status", { enum: ["lobby", "playing", "finished"] })
      .notNull()
      .default("lobby"),
    nValue: smallint("n_value").notNull().default(2),
    stimuliCount: smallint("stimuli_count").notNull().default(20),
    initialIntervalMs: integer("initial_interval_ms").notNull().default(2500),
    sequence: jsonb("sequence").$type<number[]>(),
    startedAt: bigint("started_at", { mode: "number" }),
    speedChanges: jsonb("speed_changes")
      .$type<SpeedChange[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [
    index("game_status_idx").on(t.status),
    index("game_host_idx").on(t.hostId),
  ],
);

export const gamePlayers = pgTable(
  "game_players",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    score: integer("score").notNull().default(0),
    errorCount: integer("error_count").notNull().default(0),
    errorCountAtLastSpeedChange: integer("error_count_at_last_speed_change")
      .notNull()
      .default(0),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [
    index("gp_game_idx").on(t.gameId),
    uniqueIndex("gp_unique_idx").on(t.gameId, t.userId),
  ],
);

export const stimulusAnswers = pgTable(
  "stimulus_answers",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    stimulusIndex: smallint("stimulus_index").notNull(),
    pressed: boolean("pressed").notNull(),
    correct: boolean("correct").notNull(),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (t) => [
    index("sa_game_user_idx").on(t.gameId, t.userId),
    uniqueIndex("sa_unique_idx").on(t.gameId, t.userId, t.stimulusIndex),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  hostedGames: many(game),
  gamePlayers: many(gamePlayers),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const gameRelations = relations(game, ({ one, many }) => ({
  host: one(user, { fields: [game.hostId], references: [user.id] }),
  players: many(gamePlayers),
  answers: many(stimulusAnswers),
}));

export const gamePlayersRelations = relations(gamePlayers, ({ one }) => ({
  game: one(game, { fields: [gamePlayers.gameId], references: [game.id] }),
  user: one(user, { fields: [gamePlayers.userId], references: [user.id] }),
}));

export const stimulusAnswersRelations = relations(stimulusAnswers, ({ one }) => ({
  game: one(game, { fields: [stimulusAnswers.gameId], references: [game.id] }),
  user: one(user, { fields: [stimulusAnswers.userId], references: [user.id] }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  game,
  gamePlayers,
  stimulusAnswers,
};
