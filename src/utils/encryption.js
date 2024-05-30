import crypto from 'crypto';

// 加密密码
function encryptPassword(password) {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
}

// 验证密码
function verifyPassword(inputPassword, hashedPassword) {
    const hash = encryptPassword(inputPassword);
    console.log(hash)
    console.log(hashedPassword)
    return hash === hashedPassword;
}

export { encryptPassword, verifyPassword };
