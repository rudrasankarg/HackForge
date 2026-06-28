const router = require('express').Router();
const Project = require('../models/Project');
const Evaluation = require('../models/Evaluation');
const Hackathon = require('../models/Hackathon');
const { auth, requireRole } = require('../middleware/auth');
const { processResults } = require('../services/ai/resultProcessor');

// Get results for a hackathon
router.get('/:hackathonId', auth, async (req, res) => {
  try {
    if (req.user.role === 'organizer') {
      const hackathon = await Hackathon.findById(req.params.hackathonId);
      if (!hackathon || hackathon.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You do not own this hackathon.' });
      }
    }

    const projects = await Project.find({ hackathonId: req.params.hackathonId })
      .populate('teamMembers', 'name email');
    const evaluations = await Evaluation.find({ hackathonId: req.params.hackathonId, status: 'completed' });

    if (!evaluations.length) return res.json({ results: [], message: 'No evaluations yet' });

    const results = await processResults(evaluations, projects);
    res.json({ results });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Finalise and save results (admin/organizer triggers this)
router.post('/:hackathonId/finalise', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    if (req.user.role === 'organizer') {
      const hackathon = await Hackathon.findById(req.params.hackathonId);
      if (!hackathon || hackathon.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied. You do not own this hackathon.' });
      }
    }

    const projects = await Project.find({ hackathonId: req.params.hackathonId }).populate('teamMembers', 'name email');
    const evaluations = await Evaluation.find({ hackathonId: req.params.hackathonId, status: 'completed' });

    const results = await processResults(evaluations, projects);
    const { sendResultEmail } = require('../services/emailService');

    // Persist rank and feedback back to projects
    for (const r of results) {
      const updatedProj = await Project.findByIdAndUpdate(r.project._id, {
        finalScore: r.finalScore,
        rank: r.rank,
        aiFeedback: r.feedback,
        confidenceScore: r.confidenceScore,
        status: 'evaluated',
      }, { new: true }).populate('teamMembers', 'name email');

      if (updatedProj && updatedProj.teamMembers) {
        for (const member of updatedProj.teamMembers) {
          sendResultEmail(
            member.email,
            member.name,
            r.rank,
            r.finalScore,
            r.feedback || 'Congratulations on completing the hackathon!'
          ).catch(e => console.error('Failed to send result email:', e.message));
        }
      }
    }

    res.json({ results, message: 'Results finalised successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
