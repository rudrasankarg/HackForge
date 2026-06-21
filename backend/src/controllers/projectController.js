const Project = require('../models/Project');
const Assignment = require('../models/Assignment');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');

// Helper — verify project access for participant (must be team member)
const assertTeamAccess = (project, userId) => {
  const members = project.teamMembers.map((m) => m.toString());
  return members.includes(userId.toString()) || (project.submittedBy && project.submittedBy.toString() === userId.toString());
};

// Get all projects (admin sees all; reviewer sees assigned; participant sees own team or all if results are published)
const getProjects = async (req, res) => {
  try {
    const { hackathonId } = req.query;
    const filter = hackathonId ? { hackathonId } : {};
    const role = req.user.role;

    if (role === 'admin') {
      const projects = await Project.find(filter)
        .populate('teamMembers', 'name email')
        .populate('submittedBy', 'name email')
        .sort({ rank: 1, finalScore: -1 });
      return res.json(projects);
    }

    if (role === 'organizer') {
      const myHackathons = await Hackathon.find({ createdBy: req.user._id }).select('_id');
      const hackathonIds = myHackathons.map(h => h._id);
      if (hackathonId) {
        if (!hackathonIds.map(id => id.toString()).includes(hackathonId.toString())) {
          return res.status(403).json({ message: 'Access denied: You do not own this hackathon.' });
        }
        filter.hackathonId = hackathonId;
      } else {
        filter.hackathonId = { $in: hackathonIds };
      }
      const projects = await Project.find(filter)
        .populate('teamMembers', 'name email')
        .populate('submittedBy', 'name email')
        .sort({ rank: 1, finalScore: -1 });
      return res.json(projects);
    }

    if (role === 'reviewer') {
      const assignments = await Assignment.find({ reviewerId: req.user._id }).select('projectId');
      const ids = assignments.map((a) => a.projectId);
      const projects = await Project.find({ _id: { $in: ids }, ...filter })
        .populate('teamMembers', 'name email')
        .sort({ title: 1 });
      return res.json(projects);
    }


    // Participant:
    // If results are published for the active hackathon, return all published projects
    let activeHackathonId = hackathonId;
    if (!activeHackathonId) {
      const userTeam = await Team.findOne({ members: req.user._id }).sort({ createdAt: -1 });
      if (userTeam) activeHackathonId = userTeam.hackathonId;
    }

    if (activeHackathonId) {
      const publishedProjects = await Project.find({ hackathonId: activeHackathonId, isPublished: true })
        .populate('teamMembers', 'name email')
        .sort({ rank: 1, finalScore: -1 });
      if (publishedProjects.length > 0) {
        return res.json(publishedProjects);
      }
    }

    // Fallback: Participant only sees own team's project
    const userTeam = activeHackathonId
      ? await Team.findOne({ hackathonId: activeHackathonId, members: req.user._id }).populate('projectId')
      : await Team.findOne({ members: req.user._id }).sort({ createdAt: -1 }).populate('projectId');

    if (!userTeam || !userTeam.projectId) return res.json([]);
    return res.json([userTeam.projectId]);
  } catch {
    res.status(500).json({ message: 'Could not load projects.' });
  }
};

// Get single project — strict access control
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('teamMembers', 'name email institution')
      .populate('submittedBy', 'name email');

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const role = req.user.role;

    if (role === 'admin') return res.json(project);

    if (role === 'reviewer') {
      const assignment = await Assignment.findOne({ reviewerId: req.user._id, projectId: project._id });
      if (!assignment) return res.status(403).json({ message: 'You are not assigned to this project.' });
      return res.json(project);
    }

    // Participant: must be team member
    if (!assertTeamAccess(project, req.user._id))
      return res.status(403).json({ message: 'Access denied.' });

    // Only show result if admin published it
    if (!project.isPublished) {
      const { finalScore, rank, feedback, ...rest } = project.toObject();
      return res.json({ ...rest, finalScore: null, rank: null, feedback: project.status === 'evaluated' ? 'Results pending publication.' : '' });
    }

    res.json(project);
  } catch {
    res.status(500).json({ message: 'Could not load project.' });
  }
};

// Submit/update project (participant team lead only)
const submitProject = async (req, res) => {
  try {
    const { hackathonId, title, description, techStack, domain, githubUrl, demoUrl, videoUrl } = req.body;
    if (!hackathonId) return res.status(400).json({ message: 'Hackathon ID is required.' });

    const team = await Team.findOne({ hackathonId, members: req.user._id });
    if (!team) return res.status(400).json({ message: 'You must be in a team to submit a project.' });

    const hackathon = await Hackathon.findById(team.hackathonId);
    if (!hackathon) return res.status(404).json({ message: 'Hackathon not found.' });

    if (hackathon.submissionDeadline && new Date() > hackathon.submissionDeadline)
      return res.status(410).json({ message: 'Submission deadline has passed.' });

    if (!title || !description) return res.status(400).json({ message: 'Title and description are required.' });

    let project = team.projectId ? await Project.findById(team.projectId) : null;

    if (project) {
      Object.assign(project, { title, description, techStack, domain, githubUrl, demoUrl, videoUrl, status: 'submitted', submittedAt: new Date(), submittedBy: req.user._id });
      await project.save();
    } else {
      project = await Project.create({
        title, description, techStack, domain, githubUrl, demoUrl, videoUrl,
        teamName: team.name,
        hackathonId: team.hackathonId,
        teamId: team._id,
        teamMembers: team.members,
        submittedBy: req.user._id,
        status: 'submitted',
        submittedAt: new Date(),
      });
      team.projectId = project._id;
      await team.save();
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: update project status (disqualify etc)
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['submitted', 'evaluated', 'disqualified', 'draft'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status.' });
    const project = await Project.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: publish results for a hackathon
const publishResults = async (req, res) => {
  try {
    const { hackathonId } = req.body;
    if (!hackathonId) return res.status(400).json({ message: 'Hackathon ID is required.' });

    await Project.updateMany({ hackathonId }, { isPublished: true });
    res.json({ message: 'Results published successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getProjects, getProject, submitProject, publishResults, updateStatus };
