const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Pool } = require("pg");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://oplkji.github.io/MyDashboard/DoAnTotNghiep/",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["*"],
    credentials: true,
  },
});
const port = 3000;
const cors = require("cors");
app.use(
  cors({
    origin: [
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "https://oplkji.github.io/MyDashboard/DoAnTotNghiep/",
    ],
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

// Tạo connection pool 1 lần
const pool = new Pool({
  host: "postgresql://root:4IsLhSh5wMzozc0QbQxn1zf0rPAeGSZc@dpg-d59tqrf5r7bs739gft10-a.singapore-postgres.render.com/postgresdb_h246",
  user: "root",
  password: "4IsLhSh5wMzozc0QbQxn1zf0rPAeGSZc",
  database: "postgresdb_h246",
  port: 5432,
});

io.on("connection", async (socket) => {
  console.log("New client connected!!!");

  const latest_data_node1 = await pool.query(
    // "SELECT * FROM doantotnghiep WHERE nodeID = 1 AND addressid = 3 ORDER BY id DESC LIMIT 1"
    "SELECT * FROM doantotnghiep WHERE id = 485"
  );
  const latest_data_node2 = await pool.query(
    // "SELECT * FROM doantotnghiep WHERE nodeID = 2 AND addressid = 3 ORDER BY id DESC LIMIT 1"
    "SELECT * FROM doantotnghiep WHERE id = 484"
  );
  socket.emit("init-data", {
    node1: latest_data_node1.rows[0] || null,
    node2: latest_data_node2.rows[0] || null,
  });
});

app.post("/api/data", async (req, res) => {
  const { nodeID, density, PM1, PM2, PM10, CO } = req.body;

  if (
    nodeID == null ||
    density == null ||
    PM1 == null ||
    PM2 == null ||
    PM10 == null ||
    CO == null
  ) {
    return res.status(400).json({ error: "Missing value" });
  }

  try {
    const sql =
      "INSERT INTO doantotnghiep (addressid, nodeID, density, PM1, PM10, PM2, CO) VALUES (3, $1, $2, $3, $4, $5, $6) RETURNING *";
    const result = await pool.query(sql, [nodeID, density, PM1, PM10, PM2, CO]); // dùng pool.query()
    const data = result.rows[0];
    io.emit("new-data", {
      addressid: data.addressid,
      time: data.time, // hoặc created_at tùy bạn đặt tên
      nodeID: data.nodeid,
      density: data.density,
      PM1: data.pm1,
      PM2: data.pm2,
      PM10: data.pm10,
      CO: data.co,
    });
    res.status(200).json({ message: "Data inserted successfully" });
  } catch (err) {
    console.error("Insert into database failed!!! ", err);
    res.status(500).json({ error: "Database error" });
  }
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
