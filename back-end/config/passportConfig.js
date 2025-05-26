const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const admin = require("../database/entities/admin");

const AppDataSource = require("../database/data-source");

passport.use(
  new LocalStrategy({ usernameField: "email" }, async function (
    email,
    password,
    cb
  ) {
    try {
      const loggedadmin = await AppDataSource.manager.findOneBy(admin, {
        email: email,
      });

      if (!loggedadmin) throw new Error("User not found");

      const passwordMatch = await bcrypt.compare(
        password,
        loggedadmin.password
      );
      if (!passwordMatch) throw new Error("Invalid credentials");

      return cb(null, loggedadmin);
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(async function (userId, cb) {
  try {
    const user = await AppDataSource.manager.findOneBy(admin, { id: userId });
    if (!user) {
      return cb(new Error("Admin not in session"));
    }
    return cb(null, user);
  } catch (err) {
    return cb(err);
  }
});

module.exports = passport;
