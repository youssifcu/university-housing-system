require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('./src/models/Announcement');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const announcement = await Announcement.create({
            title: "انا تعبان",
            content: "عصياح كتير اوي",
            priority: "low",
            targetRole: "all",
            createdBy: "65d8a0c5c3e6a213e4b1a415", 
            status: "active"
        });
        console.log('Success', announcement);
        process.exit(0);
    } catch (e) {
        console.log('NAME:', e.name);
        console.log('MESSAGE:', e.message);
        console.error(e);
        process.exit(1);
    }
}
test();
