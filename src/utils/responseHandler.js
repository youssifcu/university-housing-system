/**
 * Centralized Response Handler
 * Provides consistent success and error response formatting across all controllers.
 */

/**
 * Sends a standardized success response.
 * @param {Object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Success message.
 * @param {Object|null} data - Optional data to include in response.
 */
const sendSuccess = (res, statusCode, message, data = null) => {
    const response = {
        success: true,
        message
    };
    if (data !== null) {
        response.data = data;
    }
    return res.status(statusCode).json(response);
};

/**
 * Sends a standardized error response.
 * @param {Object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Error message.
 * @param {string|null} errorDetails - Optional error details (shown only in development).
 */
const sendError = (res, statusCode, message, errorDetails = null) => {
    const response = {
        success: false,
        message
    };
    // Include error details only in development environment
    if (errorDetails && process.env.NODE_ENV === 'development') {
        response.error = errorDetails;
    }
    return res.status(statusCode).json(response);
};

/**
 * Sends a paginated success response.
 * @param {Object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Success message.
 * @param {Array} items - Array of items for the current page.
 * @param {Object} pagination - Pagination metadata (page, limit, total, pages).
 */
const sendPaginated = (res, statusCode, message, items, pagination) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data: items,
        pagination
    });
};

module.exports = {
    sendSuccess,
    sendError,
    sendPaginated
};