const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

let sensorData = {
  temperature: 0,
  humidity: 0,
  methane: 0,
  co: 0,
  airQuality: 0,
  lastUpdated: null
};

// Receive data from ESP32
app.post("/api/sensor-data", (req, res) => {
  console.log("ESP32 DATA:", req.body);

  sensorData = {
    ...req.body,
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true
  });
});

// Send data to React website
app.get("/api/sensor-data", (req, res) => {
  res.json(sensorData);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SafeSewer backend running on port ${PORT}`);
});