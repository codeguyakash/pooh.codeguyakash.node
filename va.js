const crypto = require('crypto');

function generateGravatarRandomHash(length = 14) {
  let randomString = crypto.randomBytes(length).toString('hex');
  return `https://robohash.org/${randomString}?gravatar=hashed`;
}
console.log(generateGravatarRandomHash());
