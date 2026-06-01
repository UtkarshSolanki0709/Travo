import mongoose from 'mongoose';
import {ENV} from "./env.js";
import dns from 'dns';

// Fix for Node.js querySrv ECONNREFUSED error caused by local ISP/Network dropping SRV records:
dns.setServers(['8.8.8.8', '8.8.4.4']);
export const connectDB = async () => {
    try{
        const conn=await mongoose.connect(ENV.MONGO_URI);
        console.log("MongoDB connected successfully",conn.connection.host);
    }
    catch(error){
        console.error("MongoDB connection failed:", error);
        process.exit(1);
    }
}