const router = require('express').Router();
const { auth } = require('../middleware/auth');
const KanbanTask = require('../models/KanbanTask');
router.get('/:teamId', auth, async (req, res) => {
  const tasks = await KanbanTask.find({ teamId: req.params.teamId });
  res.json(tasks);
});
router.post('/', auth, async (req, res) => {
  const task = await KanbanTask.create(req.body);
  res.status(201).json(task);
});
module.exports = router;