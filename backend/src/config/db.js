const mongoose = require('mongoose');

/**
 * Masks sensitive information in MongoDB URI for logging
 */
const maskUri = (uri) => {
    try {
        // إخفاء اليوزر نيم والباسورد لو موجودين
        return uri.replace(/\/\/([^@]+)@/, '//***:***@');
    } catch (e) {
        return 'mongodb://***:***@host';
    }
};

/**
 * Establishes connection to MongoDB with enhanced options and event handling
 */
const connectDB = async () => {
    // تجهيز الرابط
    const mongoUri = 
        process.env.MONGO_URI || 
        process.env.MONGODB_URI || 
        process.env.MONGODB_TEST_URI || 
        'mongodb://localhost:27017/university-housing-system';

    // خيارات الاتصال الموصى بها للإنتاج (بدون مكتبات إضافية)
    const options = {
        // Maximum number of connection attempts if initial connection fails
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout for server selection
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        // family: 4, // Use IPv4, skip trying IPv6 (uncomment if needed)
        maxPoolSize: 10, // Maintain up to 10 socket connections
        minPoolSize: 2, // Maintain at least 2 connections
    };

    // عدد محاولات إعادة الاتصال (اختياري)
    const maxRetries = parseInt(process.env.MONGO_RETRY_ATTEMPTS) || 1;
    let attempts = 0;

    const attemptConnection = async () => {
        try {
            attempts++;
            console.log(`🔌 Attempting MongoDB connection${attempts > 1 ? ` (Attempt ${attempts}/${maxRetries})` : ''}...`);
            
            await mongoose.connect(mongoUri, options);
            
            console.log('✅ MongoDB Connected Successfully!');
            console.log('--- MongoDB Connection Details ---');
            console.log(`📡 URI: ${maskUri(mongoUri)}`);
            console.log(`🗄️ Database: ${mongoose.connection.name}`);
            console.log(`🖥️ Host: ${mongoose.connection.host}`);
            console.log(`🔢 Port: ${mongoose.connection.port}`);
            console.log('-----------------------------------');
            
            return true;
        } catch (error) {
            console.error(`❌ MongoDB Connection Error (Attempt ${attempts}/${maxRetries}):`, error.message);
            
            if (attempts < maxRetries) {
                console.log(`⏳ Retrying in 3 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                return attemptConnection();
            }
            
            // فشل بعد كل المحاولات
            console.error('💥 Could not connect to MongoDB after multiple attempts. Exiting...');
            process.exit(1);
        }
    };

    // بدء الاتصال
    await attemptConnection();

    // ==========================================
    // Event Listeners لمراقبة حالة الاتصال بعد البدء
    // ==========================================
    
    mongoose.connection.on('connected', () => {
        console.log('🟢 Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
        console.error('🔴 Mongoose connection error:', err.message);
        // ملحوظة: Mongoose هيعيد الاتصال تلقائياً، مش هنعمل exit هنا عشان النظام يفضل شغال
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('🟡 Mongoose disconnected from DB');
    });

    // لو البرنامج اتقفل، نقفل الاتصال بشكل نظيف
    process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('🔌 Mongoose connection closed due to app termination');
        process.exit(0);
    });
};

module.exports = connectDB;