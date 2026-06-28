const Appeal = require('../models/Appeal');
const Project = require('../models/Project');

// Participant: submit appeal
const submitAppeal = async (req, res) => {
  try {
    const { projectId, hackathonId, reason } = req.body;
    if (!projectId || !reason) return res.status(400).json({ message: 'Project and reason are required.' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const isMember = project.teamMembers.map((m) => m.toString()).includes(req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Access denied.' });

    const existing = await Appeal.findOne({ participantId: req.user._id, projectId });
    if (existing) return res.status(409).json({ message: 'You have already filed an appeal for this project.' });

    const appeal = await Appeal.create({ participantId: req.user._id, projectId, hackathonId: hackathonId || project.hackathonId, reason });
    res.status(201).json(appeal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Participant: get own appeals
const getMyAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ participantId: req.user._id })
      .populate('projectId', 'title teamName')
      .sort({ createdAt: -1 });
    res.json(appeals);
  } catch {
    res.status(500).json({ message: 'Could not load appeals.' });
  }
};

// Admin: list all appeals
const listAppeals = async (req, res) => {
  try {
    const { status, hackathonId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (hackathonId) filter.hackathonId = hackathonId;

    const appeals = await Appeal.find(filter)
      .populate('participantId', 'name email institution')
      .populate('projectId', 'title teamName finalScore rank')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(appeals);
  } catch {
    res.status(500).json({ message: 'Could not load appeals.' });
  }
};

// Admin: review an appeal
const reviewAppeal = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['under_review', 'accepted', 'dismissed'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status.' });

    const appeal = await Appeal.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '', reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('participantId', 'name email').populate('projectId', 'title');

    if (!appeal) return res.status(404).json({ message: 'Appeal not found.' });
    res.json(appeal);
  } catch {
    res.status(500).json({ message: 'Could not update appeal.' });
  }
};

module.exports = { submitAppeal, getMyAppeals, listAppeals, reviewAppeal };
