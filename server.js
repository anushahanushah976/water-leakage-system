
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const Report = require("./models/Report");

dotenv.config();

const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch reports" });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { reporterName, location, leakType, priority,
      description, photoUrl } = req.body;

    if (
      !reporterName?.trim() ||
      !location?.trim() ||
      !leakType ||
      !description?.trim()
    ) {
      return res.status(400).json({
        message: "Please fill in all required fields"
      });
    }

    const report = await Report.create({
      reporterName: reporterName.trim(),
      location: location.trim(),
      leakType,
      priority,
      description: description.trim(),
      photoUrl
    });

    res.status(201).json(report);
  } catch (error) {
    res.status(400).json({ message: "Could not create report" });
  }
});

app.patch("/api/reports/:id", async (req, res) => {
  try {
    const allowedStatuses = ["Pending", "In Progress", "Resolved"];

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(400).json({ message: "Could not update report" });
  }
});

app.delete("/api/reports/:id", async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: "Could not delete report" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Website running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
