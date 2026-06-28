const router = require('express').Router();
const Assignment = require('../models/Assignment');
const Project = require('../models/Project');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { assignReviewers } = require('../services/ai/reviewerAssignment');

const mapAssignment = (a) => {
  const obj = a.toObject ? a.toObject() : { ...a };
  if (obj.assignedBy === 'manual' || obj.expertiseScore === undefined || obj.expertiseScore === null) {
    obj.expertiseMatchScore = null;
  } else {
    obj.expertiseMatchScore = Math.round(obj.expertiseScore * 100);
  }
  return obj;
};

// Get assignments
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'reviewer') filter.reviewerId = req.user._id;
    if (req.query.hackathonId) filter.hackathonId = req.query.hackathonId;
    const assignments = await Assignment.find(filter)
      .populate('reviewerId', 'name email skills domains')
      .populate('projectId', 'title teamName techStack description');
    res.json(assignments.map(mapAssignment));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Run AI reviewer assignment
router.post('/ai-assign', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { hackathonId, reviewersPerProject = 2 } = req.body;
    const projects = await Project.find({ hackathonId });
    const reviewers = await User.find({ role: 'reviewer' }).select('-password');

    if (!projects.length) return res.status(400).json({ message: 'No projects found' });
    if (!reviewers.length) return res.status(400).json({ message: 'No reviewers found' });

    const { assignments, processingMs } = assignReviewers(projects, reviewers, reviewersPerProject);

    // Clear previous AI assignments for this hackathon and save new ones
    await Assignment.deleteMany({ hackathonId, assignedBy: 'ai' });
    const saved = await Assignment.insertMany(assignments.map((a) => ({ ...a, hackathonId })));

    res.json({ assignments: saved.map(mapAssignment), processingMs, count: saved.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Manual assignment override
router.post('/manual', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const { reviewerId, projectId, hackathonId } = req.body;
    const assignment = await Assignment.findOneAndUpdate(
      { reviewerId, projectId },
      { reviewerId, projectId, hackathonId, assignedBy: 'manual', confidence: 1 },
      { upsert: true, new: true }
    );
    res.status(201).json(mapAssignment(assignment));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Delete assignment
router.delete('/:id', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
