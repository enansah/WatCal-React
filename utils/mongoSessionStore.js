// utils/mongoSessionStore.js
// Keeps login sessions in MongoDB (collection "sessions") instead of the server's memory, so people stay
// logged in when the server restarts or a free host puts it to sleep. MongoDB deletes expired sessions
// itself through a TTL index on `expires`.
const session = require('express-session');
const mongoose = require('mongoose');

const FALLBACK_LIFETIME = 20 * 60 * 1000; // if a session has no cookie expiry

class MongoSessionStore extends session.Store {
  constructor({ collection = 'sessions' } = {}) {
    super();
    this.collectionName = collection;
    this.indexReady = null;
  }

  // Mongoose buffers these calls until the database connection is open
  col() {
    if (!this.indexReady) {
      this.indexReady = mongoose.connection
        .collection(this.collectionName)
        .createIndex({ expires: 1 }, { expireAfterSeconds: 0 })
        .catch((err) => {
          this.indexReady = null; // try again next time
          console.error('Could not create the session expiry index:', err.message);
        });
    }
    return mongoose.connection.collection(this.collectionName);
  }

  static expiryOf(sess) {
    const expires = sess && sess.cookie && sess.cookie.expires;
    return expires ? new Date(expires) : new Date(Date.now() + FALLBACK_LIFETIME);
  }

  get(sid, callback) {
    this.col()
      .findOne({ _id: sid })
      .then((doc) => {
        if (!doc || doc.expires <= new Date()) return callback(null, null);
        callback(null, JSON.parse(doc.session));
      })
      .catch((err) => callback(err));
  }

  set(sid, sess, callback = () => {}) {
    this.col()
      // Stored as JSON text so keys with dots or $ in them can't upset MongoDB
      .updateOne({ _id: sid }, { $set: { session: JSON.stringify(sess), expires: MongoSessionStore.expiryOf(sess) } }, { upsert: true })
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  // Each request pushes the 20-minute idle limit back (the cookie is "rolling")
  touch(sid, sess, callback = () => {}) {
    this.col()
      .updateOne({ _id: sid }, { $set: { expires: MongoSessionStore.expiryOf(sess) } })
      .then(() => callback(null))
      .catch((err) => callback(err));
  }

  destroy(sid, callback = () => {}) {
    this.col()
      .deleteOne({ _id: sid })
      .then(() => callback(null))
      .catch((err) => callback(err));
  }
}

module.exports = MongoSessionStore;
