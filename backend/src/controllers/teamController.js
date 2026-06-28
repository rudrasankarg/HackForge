const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const Project = require('../models/Project');

// Create a new team
const createTeam = async (req, res) => {
  try {
    const { name, hackathonId } = req.body;
    if (!name || !hackathonId) return res.status(400).json({ message: 'Team name and hackathon are required.' });

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) return res.status(404).json({ message: 'Hackathon not found.' });

    const user = req.user;
    const existingTeam = await Team.findOne({ hackathonId, members: user._id });
    if (existingTeam) return res.status(409).json({ message: 'You are already in a team for this hackathon. Leave your current team first.' });

    const team = await Team.create({
      name: name.trim(),
      hackathonId,
      leaderId: user._id,
      members: [user._id],
    });

    await User.findByIdAndUpdate(user._id, { teamId: team._id });
    const populated = await Team.findById(team._id).populate('members', 'name email institution skills');
    res.status(201).json(populated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid identifier format. Please ensure all selections are valid.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Join a team by invite code
const joinTeam = async (req, res) => {
  try {
    const { inviteCode, hackathonId } = req.body;
    if (!inviteCode) return res.status(400).json({ message: 'Invite code is required.' });

    const user = req.user;
    let query = { inviteCode: inviteCode.toUpperCase(), isActive: true };
    if (hackathonId) {
      query.hackathonId = hackathonId;
    }
    const team = await Team.findOne(query);
    if (!team) return res.status(404).json({ message: 'Invalid invite code or team not found.' });

    const existingTeam = await Team.findOne({ hackathonId: team.hackathonId, members: user._id });
    if (existingTeam) return res.status(409).json({ message: 'You are already in a team for this hackathon.' });

    if (team.members.length >= team.maxSize)
      return res.status(409).json({ message: `Team is full (max ${team.maxSize} members).` });

    team.members.push(user._id);
    await team.save();
    await User.findByIdAndUpdate(user._id, { teamId: team._id });

    const populated = await Team.findById(team._id).populate('members', 'name email institution skills');
    res.json(populated);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid identifier format. Please ensure all selections are valid.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Get my team
const getMyTeam = async (req, res) => {
  try {
    let hackathonId = req.query.hackathonId;
    if (!hackathonId) {
      const userTeams = await Team.find({ members: req.user._id }).sort({ createdAt: -1 });
      if (userTeams.length === 0) return res.json(null);
      hackathonId = userTeams[0].hackathonId;
    }
    const team = await Team.findOne({ hackathonId, members: req.user._id })
      .populate('members', 'name email institution skills experience')
      .populate('leaderId', 'name email')
      .populate('projectId', 'title status finalScore rank');
    res.json(team);
  } catch {
    res.status(500).json({ message: 'Could not load team.' });
  }
};

// Leave a team
const leaveTeam = async (req, res) => {
  try {
    const user = req.user;
    const hackathonId = req.query.hackathonId;
    if (!hackathonId) return res.status(400).json({ message: 'Hackathon ID is required to leave a team.' });

    const team = await Team.findOne({ hackathonId, members: user._id });
    if (!team) return res.status(400).json({ message: 'You are not in a team for this hackathon.' });

    if (team.leaderId.toString() === user._id.toString() && team.members.length > 1)
      return res.status(400).json({ message: 'Transfer leadership before leaving.' });

    team.members = team.members.filter((m) => m.toString() !== user._id.toString());

    if (team.members.length === 0) {
      team.isActive = false;
    }

    await team.save();
    if (user.teamId && user.teamId.toString() === team._id.toString()) {
      await User.findByIdAndUpdate(user._id, { teamId: null });
    }
    res.json({ message: 'Left team successfully.' });
  } catch {
    res.status(500).json({ message: 'Could not leave team.' });
  }
};

// Admin: list all teams
const listTeams = async (req, res) => {
  try {
    const { hackathonId } = req.query;
    const filter = hackathonId ? { hackathonId } : {};
    const teams = await Team.find(filter)
      .populate('members', 'name email institution')
      .populate('leaderId', 'name email')
      .populate('projectId', 'title status rank finalScore')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch {
    res.status(500).json({ message: 'Could not load teams.' });
  }
};

// Participant: get teammate suggestions based on complementarity and domain
const getTeamSuggestions = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found.' });

    // Verify requesting user is member of the team
    if (!team.members.map((m) => m.toString()).includes(req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied. You are not a member of this team.' });
    }

    // 1. Find target domains (project domain or team members' domains)
    const targetDomains = [];
    if (team.projectId) {
      const project = await Project.findById(team.projectId);
      if (project && project.domain) {
        targetDomains.push(project.domain);
      }
    }

    if (targetDomains.length === 0) {
      const members = await User.find({ _id: { $in: team.members } });
      for (const m of members) {
        if (m.domains && m.domains.length) {
          targetDomains.push(...m.domains);
        }
      }
    }

    // 2. Find skills of all current team members
    const teamMembers = await User.find({ _id: { $in: team.members } });
    const teamSkills = new Set();
    for (const m of teamMembers) {
      if (m.skills) {
        m.skills.forEach((s) => teamSkills.add(s.toLowerCase().trim()));
      }
    }

    // Find all users who are already in a team for this hackathon
    const teamsForHackathon = await Team.find({ hackathonId: team.hackathonId });
    const usersWithTeam = new Set();
    for (const t of teamsForHackathon) {
      t.members.forEach((m) => usersWithTeam.add(m.toString()));
    }

    // 3. Find other registered users (participant, no team for this hackathon)
    let query = {
      role: 'participant',
      _id: { $nin: [...team.members, ...Array.from(usersWithTeam)] }
    };

    if (targetDomains.length > 0) {
      query.domains = { $in: targetDomains };
    }

    let potentialTeammates = await User.find(query);

    // Fallback to all domainless/any domain participants if suggestions are scarce
    if (potentialTeammates.length < 5 && targetDomains.length > 0) {
      delete query.domains;
      potentialTeammates = await User.find(query);
    }

    // 4. Calculate Complementarity Score
    const suggestions = potentialTeammates.map((u) => {
      const userSkills = u.skills || [];
      let score = 0;
      if (userSkills.length > 0) {
        const uniqueSkills = userSkills.filter((s) => !teamSkills.has(s.toLowerCase().trim()));
        score = (uniqueSkills.length / userSkills.length) * 100;
      }
      return {
        id: u._id,
        name: u.name,
        skills: u.skills,
        complementarityScore: Math.round(score)
      };
    });

    suggestions.sort((a, b) => b.complementarityScore - a.complementarityScore);

    res.json(suggestions.slice(0, 5));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createTeam, joinTeam, getMyTeam, leaveTeam, listTeams, getTeamSuggestions };
