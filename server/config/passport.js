const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, avatar_url FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length > 0) {
      done(null, result.rows[0]);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let result = await db.query(
      'SELECT id, email, full_name, avatar_url FROM users WHERE google_id = $1',
      [profile.id]
    );

    if (result.rows.length > 0) {
      // User exists, return the user
      return done(null, result.rows[0]);
    }

    // Check if user exists with this email
    result = await db.query(
      'SELECT id, email, full_name, avatar_url FROM users WHERE email = $1',
      [profile.emails[0].value]
    );

    if (result.rows.length > 0) {
      // User exists with this email, update with Google ID
      const updateResult = await db.query(
        'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, email, full_name, avatar_url',
        [profile.id, result.rows[0].id]
      );
      return done(null, updateResult.rows[0]);
    }

    // Create new user
    const newUserResult = await db.query(
      'INSERT INTO users (email, full_name, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, avatar_url',
      [
        profile.emails[0].value,
        profile.displayName,
        profile.id,
        profile.photos[0]?.value || null
      ]
    );

    return done(null, newUserResult.rows[0]);
  } catch (error) {
    return done(error, null);
  }
}));

module.exports = passport;
