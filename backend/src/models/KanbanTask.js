const mongoose = require('mongoose');

const kanbanTaskSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  assignee: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('KanbanTask', kanbanTaskSchema);
