const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "vault.sqlite"));

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    post TEXT,
    username TEXT,
    tweet_id TEXT,
    timestamp INTEGER,
    height TEXT,
    fit TEXT,
    poster TEXT,
    retweet_username TEXT,
    tweet_creation_timestamp INTEGER,
    tweet_timestamp INTEGER,
    tags TEXT DEFAULT '[]',
    note TEXT,
    collection_name TEXT,
    resume_token TEXT,
    browse_username TEXT,
    tweet_user_id TEXT
  );

  CREATE INDEX IF NOT EXISTS bookmarks_user_id ON bookmarks(user_id);

  CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_url TEXT,
    tweet_id TEXT,
    timestamp INTEGER,
    username TEXT,
    tweet_user_id TEXT
  );

  CREATE INDEX IF NOT EXISTS photos_user_id ON photos(user_id);

  CREATE TABLE IF NOT EXISTS personas (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT,
    summary TEXT,
    tweet_count INTEGER,
    created_at INTEGER,
    twitter_avatar_url TEXT,
    avatar_url TEXT,
    display_name TEXT
  );

  CREATE INDEX IF NOT EXISTS personas_user_id ON personas(user_id);

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    persona_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    image_url TEXT,
    timestamp INTEGER
  );

  CREATE INDEX IF NOT EXISTS chat_messages_lookup ON chat_messages(user_id, persona_id, timestamp);

  CREATE TABLE IF NOT EXISTS notification_settings (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    enabled INTEGER DEFAULT 0,
    frequency INTEGER DEFAULT 1,
    fcm_token TEXT,
    last_notified_at INTEGER DEFAULT 0
  );
`);

module.exports = db;
