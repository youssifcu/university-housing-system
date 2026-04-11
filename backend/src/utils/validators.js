/**
 * Validate Egyptian national ID (14 digits)
 */
const isValidNationalId = (id) => {
    return /^\d{14}$/.test(id);
};

/**
 * Validate Egyptian phone number
 */
const isValidEgyptianPhone = (phone) => {
    return /^01[0-2,5]{1}[0-9]{8}$/.test(phone);
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    return /^\S+@\S+\.\S+$/.test(email);
};

module.exports = { isValidNationalId, isValidEgyptianPhone, isValidEmail };