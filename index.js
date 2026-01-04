const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

// CONNECTING TO MONGODB
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@myfirstcluster.agauwwe.mongodb.net/?appName=MyFirstCluster`;

// SERVER ENTYR POINT
app.get("/", (req, res) => {
  res.send("Message From Server Home");
});

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();
    const db = client.db("cleanlinessDB");
    const issuesCollection = db.collection("issues");
    const contributionCollection = db.collection("contributions");

    // ADD ISSUE API
    app.post("/add-issue", async (req, res) => {
      const newIssue = req.body;
      const result = await issuesCollection.insertOne(newIssue);
      res.send(result);
    });

    // Add Contribution API
    app.post("/add-contribution", async (req, res) => {
      const newContribution = req.body;
      const result = await contributionCollection.insertOne(newContribution);
      res.send(result);
    });

    // ALL ISSUES API with Search and Pagination
    app.get("/all-issues", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 8;
      const search = req.query.search || ""; // Get search text from query
    
      // Create a search query object
      // This looks for the search text inside the "title" field (case-insensitive)
      const query = {
        title: { $regex: search, $options: "i" }
      };
    
      const skip = (page - 1) * size;
    
      // 1. Find issues matching the search, then skip and limit
      const cursor = issuesCollection.find(query).skip(skip).limit(size);
      const result = await cursor.toArray();
    
      // 2. Count only the documents that match the search query
      const totalCount = await issuesCollection.countDocuments(query);
    
      res.send({ result, totalCount });
    });

    // LATEST ISSUES API
    app.get("/latest-issues", async (req, res) => {
      const cursor = issuesCollection.find().limit(8).sort({ date: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get Issue By Id
    app.get("/issue-details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);
      res.send(result);
    });

    // Get all contributions by issue id
    app.get("/issue/:id/contributions", async (req, res) => {
      console.log("hitting");
      const id = req.params.id;
      const query = { issueId: id };
      const cursor = contributionCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get all issue reported by current user
    app.get("/my-issues", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = issuesCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Delete Issue
    app.delete("/issue/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.deleteOne(query);
      res.send(result);
    });

    // Update issue status
    app.patch("/issue/update/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      if (!req.body) {
        return;
      }
      const update = req.body;
      const result = await issuesCollection.updateOne(query, {
        $set: update,
      });
      res.send(result);
    });

    // Get contributions by email
    app.get("/my-contributions", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = contributionCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // resolved issues
    app.get("/resolved/issues", async (req, res) => {
      const cursor = issuesCollection.find({ status: "Ended" });
      const result = await cursor.toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

app.listen(port, () => {
  console.log("server is running ");
});

run().catch(console.dir);
// module.exports = app;
