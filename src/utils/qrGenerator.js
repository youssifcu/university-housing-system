const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a random QR string
 */
const generateQRString = (prefix = 'STU') => {
    const random = crypto.randomBytes(12).toString('hex');
    return `${prefix}-${random}-${Date.now().toString(36)}`;
};

/**
 * Generate QR data URL
 */
const generateQRDataURL = async (text) => {
    try {
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'M',
            margin: 2,
            scale: 8
        });
    } catch (error) {
        throw new Error('Failed to generate QR code');
    }
};

module.exports = { generateQRString, generateQRDataURL };