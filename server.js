const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const userFile = path.join(dataDir, "user.json");

const sessions = new Map();

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

const readUser = () => {
  if (!fs.existsSync(userFile)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(userFile, "utf8"));
  } catch (error) {
    return null;
  }
};

const writeUser = (user) => {
  ensureDataDir();
  fs.writeFileSync(userFile, JSON.stringify(user, null, 2));
};

const hashPassword = (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
};

const parseCookies = (cookieHeader) => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((acc, item) => {
    const [key, ...value] = item.trim().split("=");
    acc[key] = decodeURIComponent(value.join("="));
    return acc;
  }, {});
};

const createSession = (email) => {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, { email, createdAt: Date.now() });
  return token;
};

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/session", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = cookies.vertex_session && sessions.get(cookies.vertex_session);

  if (!session) {
    res.json({ authenticated: false });
    return;
  }

  res.json({ authenticated: true, email: session.email });
});

app.post("/api/signup", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const existingUser = readUser();
  if (existingUser) {
    res.status(409).json({ error: "An account already exists." });
    return;
  }

  const { salt, hash } = hashPassword(password);
  writeUser({ email, salt, hash, createdAt: new Date().toISOString() });

  const token = createSession(email);
  res.setHeader(
    "Set-Cookie",
    `vertex_session=${token}; HttpOnly; Path=/; SameSite=Lax`
  );
  res.json({ email });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = readUser();
  if (!user) {
    res.status(403).json({ error: "No account exists yet." });
    return;
  }

  const { hash } = hashPassword(password, user.salt);
  if (user.email !== email || user.hash !== hash) {
    res.status(403).json({ error: "Invalid credentials." });
    return;
  }

  const token = createSession(email);
  res.setHeader(
    "Set-Cookie",
    `vertex_session=${token}; HttpOnly; Path=/; SameSite=Lax`
  );
  res.json({ email });
});

app.post("/api/logout", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.vertex_session) {
    sessions.delete(cookies.vertex_session);
  }

  res.setHeader(
    "Set-Cookie",
    "vertex_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Vertex server running on http://localhost:${port}`);
});
