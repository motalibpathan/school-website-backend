const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

const uri = process.env.DB_URI;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const userCollection = client.db("schoolBackend").collection("users");
    const admissionCollection = client
      .db("schoolBackend")
      .collection("admission");
    const noticeCollection = client.db("schoolBackend").collection("notices");

    app.get("/api/login", async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      if (user.password === password) {
        return res.send(user);
      }
      return res.send({ msg: "User Not Found!" });
    });

    app.get("/api/notices", verifyJWT, async (req, res) => {
      const notices = await noticeCollection.find({}).toArray();
      res.send(notices);
    });
    app.post("/api/notices", async (req, res) => {
      const result = await noticeCollection.insertOne(req.body);
      res.send(result);
    });
    app.post("/api/admission", async (req, res) => {
      const result = await admissionCollection.insertOne(req.body);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("School website server is running");
});

app.listen(port, () => console.log(`School website running on ${port}`));
