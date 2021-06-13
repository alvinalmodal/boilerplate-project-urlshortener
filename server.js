require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const fetch = require("node-fetch");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());

// mongoose setup
const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
mongoose.connect(
  `mongodb+srv://${process.env.MONGO_DB_USER}:${process.env.MONGO_DB_PASSWORD}@cluster0.wqup4.mongodb.net/urlshortener?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("mongodb connected...");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

const { Schema } = mongoose;

const urlSchema = new Schema({
  original_url: { type: String, required: true },
});

urlSchema.plugin(AutoIncrement, { inc_field: "short_url" });

let URL = mongoose.model("URL", urlSchema);

app.get("/api/shorturl/:id", async (req, res) => {
  let url = await URL.findOne({ short_url: req.params.id });
  if (url.original_url) {
    res.redirect(url.original_url);
    return;
  }
  res.send({ error: "invalid shorturl id", url });
});

app.post("/api/shorturl", async (req, res) => {
  let url = req.body.url;

  if (!url) {
    res.status(400);
    res.send({ error: "Please provide a url." });
    return;
  }

  // check if valid url
  let urlResponse = "invalid url";
  try {
    urlResponse = await fetch(url);
    urlResponse = {
      original_url: url,
    };
    let result = await URL.create(urlResponse);
    urlResponse.short_url = result.short_url;
  } catch (error) {
    urlResponse = `invalid url`;
  }

  res.send(urlResponse);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
