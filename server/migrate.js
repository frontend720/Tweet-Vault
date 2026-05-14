/**
 * One-time migration: Firestore + RTDB → SQLite
 *
 * Prerequisites:
 *   1. Copy .env.example to .env and set GOOGLE_APPLICATION_CREDENTIALS
 *      (Service Account key with Firestore + RTDB read access)
 *   2. npm install (in this server/ directory)
 *
 * Run: node migrate.js
 *
 * Safe to re-run — uses INSERT OR IGNORE so existing rows are skipped.
 */

require("dotenv").config();
const admin = require("firebase-admin");
const db = require("./db");

if (!admin.apps.length) admin.initializeApp();

const firestore = admin.firestore();
const rtdb = admin.database();

async function migrate() {
  console.log("Starting migration...\n");

  // ── 1. Discover all users from Firestore ─────────────────────────────────
  // Bookmarks live in top-level collections named by user email.
  // Personas/photos/settings live under users/{email}/...
  // We enumerate both.

  const usersRef = firestore.collection("users");
  const usersSnap = await usersRef.listDocuments();
  const emails = usersSnap.map((d) => d.id);
  console.log(`Found ${emails.length} user(s): ${emails.join(", ")}\n`);

  // We need email → UID mapping for RTDB (RTDB keys are Firebase UIDs).
  // Pull it from the notification settings doc where we stored uid.
  const emailToUid = {};
  for (const email of emails) {
    const notifSnap = await firestore
      .collection("users").doc(email)
      .collection("settings").doc("notifications").get();
    if (notifSnap.exists && notifSnap.data().uid) {
      emailToUid[email] = notifSnap.data().uid;
    }
  }

  const insertBookmark = db.prepare(`
    INSERT OR IGNORE INTO bookmarks
      (id, user_id, post, username, tweet_id, timestamp, height, fit, poster,
       retweet_username, tweet_creation_timestamp, tweet_timestamp, tags, note,
       collection_name, resume_token, browse_username, tweet_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPhoto = db.prepare(`
    INSERT OR IGNORE INTO photos
      (id, user_id, image_url, tweet_id, timestamp, username, tweet_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPersona = db.prepare(`
    INSERT OR IGNORE INTO personas
      (id, user_id, username, summary, tweet_count, created_at,
       twitter_avatar_url, avatar_url, display_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertChat = db.prepare(`
    INSERT OR IGNORE INTO chat_messages
      (user_id, persona_id, role, content, image_url, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertNotif = db.prepare(`
    INSERT OR REPLACE INTO notification_settings
      (user_id, email, enabled, frequency, fcm_token, last_notified_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const email of emails) {
    const uid = emailToUid[email];
    console.log(`\n── ${email} (uid: ${uid ?? "unknown"}) ──`);

    // ── Bookmarks ──────────────────────────────────────────────────────────
    // Stored in top-level Firestore collection named after the email
    let bookmarkCount = 0;
    try {
      const snap = await firestore.collection(email).get();
      const insertMany = db.transaction((docs) => {
        for (const d of docs) {
          const data = d.data();
          insertBookmark.run(
            d.id,
            uid ?? email, // use UID if known, fall back to email for now
            data.post ?? null,
            data.username ?? null,
            data.tweetId ?? null,
            data.timestamp ?? Date.now(),
            data.height ?? null,
            data.fit ?? null,
            data.poster ?? null,
            data.retweet_username ?? null,
            data.tweet_creation_timestamp ?? null,
            data.tweet_timestamp ?? null,
            JSON.stringify(data.tags ?? []),
            data.note ?? null,
            data.collectionName ?? null,
            data.resumeToken ?? null,
            data.browseUsername ?? null,
            data.user_id ?? null,
          );
        }
      });
      insertMany(snap.docs);
      bookmarkCount = snap.size;
    } catch (err) {
      console.warn(`  Bookmarks: skipped (${err.message})`);
    }
    console.log(`  Bookmarks: ${bookmarkCount}`);

    // ── Photos ─────────────────────────────────────────────────────────────
    let photoCount = 0;
    try {
      const snap = await firestore.collection("users").doc(email).collection("photos").get();
      const insertMany = db.transaction((docs) => {
        for (const d of docs) {
          const data = d.data();
          insertPhoto.run(
            d.id, uid ?? email,
            data.imageUrl ?? null, data.tweetId ?? null,
            data.timestamp ?? Date.now(), data.username ?? null, data.user_id ?? null,
          );
        }
      });
      insertMany(snap.docs);
      photoCount = snap.size;
    } catch (err) {
      console.warn(`  Photos: skipped (${err.message})`);
    }
    console.log(`  Photos: ${photoCount}`);

    // ── Personas ───────────────────────────────────────────────────────────
    let personaCount = 0;
    const personaIds = [];
    try {
      const snap = await firestore.collection("users").doc(email).collection("personas").get();
      const insertMany = db.transaction((docs) => {
        for (const d of docs) {
          const data = d.data();
          insertPersona.run(
            d.id, uid ?? email,
            data.username ?? null, data.summary ?? null,
            data.tweetCount ?? 0, data.createdAt ?? Date.now(),
            data.twitterAvatarUrl ?? null, data.avatarUrl ?? null, data.displayName ?? null,
          );
          personaIds.push(d.id);
        }
      });
      insertMany(snap.docs);
      personaCount = snap.size;
    } catch (err) {
      console.warn(`  Personas: skipped (${err.message})`);
    }
    console.log(`  Personas: ${personaCount}`);

    // ── Chat Messages (RTDB) ───────────────────────────────────────────────
    let chatCount = 0;
    if (uid && personaIds.length) {
      for (const personaId of personaIds) {
        try {
          const snap = await rtdb.ref(`chats/${uid}/${personaId}`).once("value");
          const data = snap.val();
          if (!data) continue;
          const msgs = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
          const insertMany = db.transaction((rows) => {
            for (const m of rows) {
              insertChat.run(
                uid, personaId, m.role ?? "user",
                m.content ?? null, m.imageUrl ?? null, m.timestamp ?? Date.now(),
              );
            }
          });
          insertMany(msgs);
          chatCount += msgs.length;
        } catch (err) {
          console.warn(`  Chat ${personaId}: skipped (${err.message})`);
        }
      }
    }
    console.log(`  Chat messages: ${chatCount}`);

    // ── Notification Settings ──────────────────────────────────────────────
    try {
      const snap = await firestore
        .collection("users").doc(email)
        .collection("settings").doc("notifications").get();
      if (snap.exists) {
        const d = snap.data();
        insertNotif.run(
          uid ?? email, email,
          d.enabled ? 1 : 0, d.frequency ?? 1,
          d.fcmToken ?? null, d.lastNotifiedAt ?? 0,
        );
        console.log(`  Notification settings: migrated`);
      }
    } catch (err) {
      console.warn(`  Notification settings: skipped (${err.message})`);
    }
  }

  console.log("\nMigration complete.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
