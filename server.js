const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.error(err.name, err.message);
  process.exit(1);
});

const app = require("./app");

const DB_CONN_STR = process.env.DATABASE_URL;

mongoose
  .connect(DB_CONN_STR, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((conn) => {
    console.log("Database has connected successfully!🎉");
  })
  .catch((err) => console.log("Database couldn't connect.", err));

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});

// Unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
