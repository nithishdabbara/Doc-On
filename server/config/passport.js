const GoogleStrategy = require('passport-google-oauth20').Strategy;
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');

module.exports = function (passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID || "GOOGLE_CLIENT_ID_PLACEHOLDER",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "GOOGLE_CLIENT_SECRET_PLACEHOLDER",
        callbackURL: "/api/auth/google/callback"
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user exists
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                } else {
                    // Check if email exists (link accounts logic could go here, but keeping simple)
                    user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // Start Update existing user with Google ID
                        user.googleId = profile.id;
                        await user.save();
                        return done(null, user);
                    }

                    // Create New User (Default to Patient)
                    const newUser = new User({
                        googleId: profile.id,
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        role: 'patient',
                        isVerified: true
                    });

                    await newUser.save();

                    // Create linked Patient Profile
                    const newPatient = new Patient({
                        user: newUser._id,
                        isVerified: true,
                        profile: {
                            // Google photo could be stored here or on User if schema allowed, 
                            // but Patient schema has 'profile' obj.
                            // keeping it simple for now, maybe add photo later if needed since Patient schema doesn't have photo field explicitly in profile object shown earlier.
                        }
                    });

                    await newPatient.save();

                    return done(null, newUser);
                }
            } catch (err) {
                console.error(err);
                return done(err, null);
            }
        }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user));
    });
};
