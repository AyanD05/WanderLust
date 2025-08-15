const mongoose=require("mongoose");
const Listing = require("../models/listing.js");
const initData=require("./data.js");

// Define your MongoDB connection string here
const MONGO_URL = "mongodb://localhost:27017/wanderlust";

async function main(){
    await mongoose.connect(MONGO_URL);
}
const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initData.data);
    console.log("Data has been initialized");
};

main().then(async () => {
    console.log("Connected to DB");
    await initDB();
}).catch((err) => {
    console.log("Error in connecting DB", err);
}).finally(() => {
    mongoose.connection.close();
});