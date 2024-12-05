import mongoose from "mongoose";

const connectDB = async () => {
    try {
        // Set the listener for the 'connected' event before making the connection
        mongoose.connection.on('connected', () => {
            console.log("Database connected");
        });

        // Connect using the URI that now includes the database name
        await mongoose.connect(process.env.MONGODB_URI, {
           
        });

    } catch (error) {
        console.error("Error connecting to the database", error);
    }
};

export default connectDB;
