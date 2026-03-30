const mongoose = require("mongoose");
const fs = require("fs");
const Tour = require("../models/tourModel");
const dotenv = require("dotenv");

dotenv.config({ path: "./../config.env" });

const DB_CONN_STR = process.env.DATABASE_URL;

mongoose.connect(DB_CONN_STR, { 
        useNewUrlParser: true,
        useCreateIndex: true, 
        useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((conn) => {
        console.log("Database has connected successfully!🎉")
    })
    .catch((err)=> console.log("Database couldn't connect.", err));

// READ FILE
const tours = JSON.parse(fs.readFileSync("./tours.json", "utf-8"));

// IMPORT DATA
const importData = async () =>{
    try {
        const newTours = await Tour.create(tours);
        console.log("Data successfully loaded 🟢");
        console.log(newTours);
    } catch (error) {
        console.log(error)
    }
    process.exit();
}

// DELETE ALL DATA
const deleteData = async () =>{
    try {
        const deletedTours = await Tour.deleteMany();
        console.log("Data successfully deleted 🟢");
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

if (process.argv[2] === "-import") {
    importData();
} else if(process.argv[2] === "-delete"){
    deleteData();
} else {
    console.log("No options provided. Such a shame");
}