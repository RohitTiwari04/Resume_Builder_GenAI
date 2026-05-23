const mongoose = require('mongoose');

async function connectDB() {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to Database");

        // Drop legacy name_1 unique index on users collection if it exists to allow new registrations
        try {
            await mongoose.connection.collection('users').dropIndex('name_1');
            console.log("Dropped legacy index 'name_1' successfully.");
        } catch (indexError) {
            // Ignore error if the index does not exist (code 27 / IndexNotFound)
            if (indexError.code !== 27 && indexError.codeName !== 'IndexNotFound') {
                console.warn("Failed to drop legacy index 'name_1':", indexError.message);
            }
        }
    } catch (error) {
        console.error("Error connecting to Database:", error);
    }
}

module.exports = connectDB;