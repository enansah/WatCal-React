// utils/sessionAccount.js
// What to keep in the login session for an account: everything except the password hash and the meter
// readings (which grow every 15 minutes and are always loaded fresh from the database when needed).
module.exports = function sessionAccount(doc) {
  const account = doc && typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete account.password;
  delete account.readings;
  return account;
};
