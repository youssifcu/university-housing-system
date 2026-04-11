const app = require('./src/app');
const connectDB = require('./src/config/db');
require('dotenv').config();

// ==========================================
// 1. Environment Variables Validation
// ==========================================
const requiredEnvVars = ['MONGODB_URI']; // أضف هنا المتغيرات الإجبارية لو عندك
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Fatal Error: Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1); // وقف التشغيل فوراً لو في حاجة ناقصة أساسية
}

// تحذير بسيط لو Firebase Variables مش موجودة (زي ما كنت عامل)
const optionalEnvVars = ['FIREBASE_PROJECT_ID'];
const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
if (missingOptional.length > 0) {
    console.warn(`⚠️ Warning: Optional environment variables missing: ${missingOptional.join(', ')}. Some features may not work.`);
}

// ==========================================
// 2. Start Server Function (Async)
// ==========================================
const startServer = async () => {
    try {
        // الاتصال بقاعدة البيانات الأول وبعدين نبدأ السيرفر
        await connectDB();
        console.log('✅ Database connected successfully');

        const PORT = process.env.PORT || 5000;
        // Notice the "0.0.0.0" added right after PORT
        const server = app.listen(PORT, "0.0.0.0", () => {
            console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
        });
        
        // ==========================================
        // 3. Socket.io Configuration
        // ==========================================
        const io = require('socket.io')(server, {
            cors: {
                // تحسين: دعم Array of Origins بدل String واحد عشان Production
                origin: process.env.CORS_ORIGIN 
                    ? process.env.CORS_ORIGIN.split(',') 
                    : ['http://localhost:3000', 'http://localhost:5000'],
                methods: ["GET", "POST", "PUT", "DELETE"],
                credentials: true
            }
        });

        // حقن الـ io في الـ app عشان نستخدمه في الكنترولر
        app.set('io', io);

        io.on('connection', (socket) => {
            console.log(`🔌 Socket Connected: ${socket.id}`);

            socket.on('disconnect', (reason) => {
                console.log(`🔌 Socket Disconnected: ${socket.id} - Reason: ${reason}`);
            });

            // مثال لاستقبال حدث مخصص (حطه هنا لو حابب)
            // socket.on('join-room', (room) => { socket.join(room); });
        });

        // ==========================================
        // 4. Graceful Shutdown (مهم جداً للإنتاج)
        // ==========================================
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
            
            // 1. نقفل السيرفر عشان منستقبلش طلبات جديدة
            server.close(async () => {
                console.log('🔒 HTTP server closed.');
                
                // 2. نقفل اتصال قاعدة البيانات (لو الـ connectDB بيرجع connection object)
                try {
                    const mongoose = require('mongoose');
                    await mongoose.connection.close();
                    console.log('📦 MongoDB connection closed.');
                } catch (dbError) {
                    console.error('❌ Error closing DB connection:', dbError);
                }
                
                process.exit(0);
            });

            // لو السيرفر قفل بعد 10 ثواني بالقوة (Force Kill)
            setTimeout(() => {
                console.error('❌ Could not close connections in time, forcefully shutting down.');
                process.exit(1);
            }, 10000);
        };

        // الاستماع لإشارات الإنهاء
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        module.exports = { server, io };
        return server;

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
};

// ==========================================
// 5. Global Error Handlers (Last Line of Defense)
// ==========================================
process.on('uncaughtException', (err) => {
    console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message, err.stack);
    // هنا مش بنعمل exit(1) على طول، بنسيب الـ graceful shutdown يشتغل
    // ولكن لو احتاجت، ممكن تعمل process.exit(1) هنا برضه
});

// ==========================================
// 6. Kick-off
// ==========================================
startServer();