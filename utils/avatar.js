// utils/avatar.js
// Profile photos are stored as small data URLs (the browser crops them to a 256px square first).

const AVATAR = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/;
const MAX_AVATAR_LENGTH = 400 * 1024; // ~300 KB image; a 256px JPEG is far smaller

// Returns an error message, or null when `avatar` is a valid photo (or null, meaning "remove")
function avatarError(avatar) {
    if (avatar !== null && (typeof avatar !== 'string' || !AVATAR.test(avatar))) {
        return 'The photo must be a PNG, JPEG or WebP image';
    }
    if (avatar && avatar.length > MAX_AVATAR_LENGTH) {
        return 'The photo is too large';
    }
    return null;
}

module.exports = { avatarError };
