// two funcs: encrypt and decrypt. --> for TOTP secret
// symmetric encryption 
//
// reference used: 1. https://medium.com/@tony.infisical/guide-to-nodes-crypto-module-for-encryption-decryption-65c077176980
// reference used: 2. https://stackoverflow.com/questions/78687009/how-to-encrypt-decrypt-with-node-js-crypto-module


const crypto = require("crypto"); // ships with node

const ALGORITHM = 'aes-256-gcm'
function encrypt(text) {
  const iv = crypto.randomBytes(12)
  const key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY, "base64") // load from .nev; must be 32 bytes, buffer --> same as goLangs 
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const cipherText = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  // the decrypt function needs the iv and the tag. thus, we need to concat them to our encrypted text and save it
  // to our database. otherwise, we will need a separate iv and tag fields in our database. --> not considering. 
  //
  // order: IV = bytes 0–12, tag = bytes 12–28, ciphertext = the rest.
  const encrypted = Buffer.concat([iv, tag, cipherText]) // stack overflow and crypto documentation

  return encrypted.toString('base64')
}


function decrypt(encryptedText) {
  // convert the string to a buffer 
  const iv_Tag_CipherText = Buffer.from(encryptedText, 'base64')

  //extract key from process.env
  const key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY, "base64")
  // extract iv, tag and cipherText from the buffer 
  const iv = iv_Tag_CipherText.subarray(0, 12)
  const tag = iv_Tag_CipherText.subarray(12, 28)
  const cipherText = iv_Tag_CipherText.subarray(28)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(Buffer.from(tag, 'base64'))

  const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()])

  return decrypted.toString('utf-8')
}

// export both functions

module.exports = { encrypt, decrypt }

