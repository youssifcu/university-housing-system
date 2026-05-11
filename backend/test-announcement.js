const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const Announcement = require('./src/models/Announcement');

async function test() {
    let mongoServer;
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        await mongoose.connect(uri);

        console.log('Connected to Memory Server');

        // Simulate creating announcement exactly as in controller
        const title = 'انا تعبان';
        const content = 'عصياح كتير اوي';
        const priority = 'low';
        const targetRole = 'all';
        const createdBy = new mongoose.Types.ObjectId();

        const announcement = await Announcement.create({
            title: title.trim(),
            content: content.trim(),
            priority: priority || 'medium',
            targetRole: targetRole || 'all',
            createdBy: createdBy, 
            status: 'active'
        });

        console.log('Successfully created:', announcement);

    } catch (error) {
        console.error('ERROR NAME:', error.name);
        console.error('ERROR MESSAGE:', error.message);
        console.error('ERROR STACK:', error.stack);
    } finally {
        if (mongoose.connection) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        process.exit();
    }
}
test();
