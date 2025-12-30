require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

/* =======================
   MongoDB Connection
======================= */
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

/* =======================
   Schemas
======================= */
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

const TaskSchema = new mongoose.Schema({
  title: String,
  userId: mongoose.Schema.Types.ObjectId
});

const User = mongoose.model('User', UserSchema);
const Task = mongoose.model('Task', TaskSchema);

/* =======================
   Auth Middleware
======================= */
const auth = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ message: 'No token' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.user = decoded;
      next();
    } catch {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

/* =======================
   Auth Routes
======================= */
app.post('/api/v1/register', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    await User.create({ email, password: hash, role: role || 'user' });
    res.status(201).json({ message: 'User registered' });
  } catch {
    res.status(400).json({ message: 'User exists' });
  }
});

app.post('/api/v1/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

/* =======================
   Task CRUD
======================= */
app.get('/api/v1/tasks', auth(), async (req, res) => {
  const query = req.user.role === 'admin'
    ? {}
    : { userId: req.user.id };

  const tasks = await Task.find(query);
  res.json(tasks);
});

app.post('/api/v1/tasks', auth(), async (req, res) => {
  if (!req.body.title) {
    return res.status(400).json({ message: 'Title required' });
  }

  const task = await Task.create({
    title: req.body.title,
    userId: req.user.id
  });

  res.status(201).json(task);
});

app.put('/api/v1/tasks/:id', auth(), async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });

  if (req.user.role !== 'admin' && task.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  task.title = req.body.title || task.title;
  await task.save();
  res.json(task);
});

app.delete('/api/v1/tasks/:id', auth(), async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: 'Not found' });

  if (req.user.role !== 'admin' && task.userId.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  await task.deleteOne();
  res.json({ message: 'Deleted' });
});

/* =======================
   Server
======================= */
app.listen(3000, () => console.log('Server running on port 3000'));
