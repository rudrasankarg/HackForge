const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const ChatAlert = require('../models/ChatAlert');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const Project = require('../models/Project');
const { auth, requireRole } = require('../middleware/auth');
const { callGemini } = require('../services/gemini');

// Helper to check message safety using Gemini
const checkMessageSafety = async (text) => {
  const prompt = `Analyze the following message sent in a hackathon private team chat: "${text}".
Determine if the message contains dangerous, illegal, highly offensive, abusive, or cheating/malicious behavior (e.g. sharing credentials, hacking the hackathon platform, bullying, harassment, explicit threats, code leaks).
Reply with exactly "SAFE" or "MALICIOUS". Do not include any other text.`;
  
  const response = await callGemini(prompt);
  if (response && response.trim().toUpperCase().includes('MALICIOUS')) {
    return true;
  }

  // Fallback keyword check if AI key is missing or fails
  const dangerousKeywords = [
    'hack the platform', 'leak password', 'ddos', 'steal token',
    'sql injection', 'kill myself', 'kill you', 'bomb', 'abuse'
  ];
  return dangerousKeywords.some(keyword => text.toLowerCase().includes(keyword));
};

// Admin endpoints for security alerts (Admin / Organizer)
router.get('/security/alerts', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const alerts = await ChatAlert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/security/alerts/:id/resolve', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const alert = await ChatAlert.findByIdAndUpdate(req.params.id, { resolved: true }, { new: true });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Personal Chatbot Endpoint
router.post('/bot', auth, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    // Gather context
    const hackathon = await Hackathon.findOne();
    const team = await Team.findOne({ members: req.user._id }).sort({ createdAt: -1 }).populate('members', 'name email');
    const project = team && team.projectId ? await Project.findById(team.projectId) : null;

    // Create user message
    const userMsg = await ChatMessage.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      body: body.trim(),
      room: `chatbot-${req.user._id}`,
    });

    const systemPrompt = `You are HackGPT, the official personal AI helper for HackForge.
You have access to all the information about the hackathon and the participant.
Guidelines:
1. Provide extremely helpful, clear, and direct answers to guide the user.
2. Be friendly and encouraging.
3. Keep answers concise but complete (2-4 sentences is usually best).

Event Context:
- Hackathon Name: ${hackathon ? hackathon.name : 'HackForge 2026'}
- Description: ${hackathon ? hackathon.description : 'A premier global hackathon'}
- Rules: ${hackathon ? hackathon.rules : 'Build innovative projects, submit before deadline.'}

Participant Context:
- Name: ${req.user.name}
- Email: ${req.user.email}
- Role: ${req.user.role}
- Skills: ${req.user.skills ? req.user.skills.join(', ') : 'None'}

Team Context:
${team ? `- Team Name: ${team.name}\n- Team Invite Code: ${team.inviteCode}\n- Members: ${team.members.map(m => m.name).join(', ')}` : '- No Team joined yet.'}

Project Context:
${project ? `- Project Name: ${project.title}\n- Description: ${project.description}\n- Submission Status: ${project.submitted ? 'Submitted' : 'Draft'}` : '- No project submitted yet.'}

User's Question: "${body}"
Please answer directly.`;

    let reply = await callGemini(systemPrompt);

    // Context-aware fallback if Gemini is overloaded (e.g. 503/429)
    if (!reply) {
      const query = body.toLowerCase();
      if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
        reply = `Hello ${req.user.name}! I am HackGPT. The AI service is currently experiencing high load, but I can still assist you. Ask me about your "team", "project", or the hackathon "rules"!`;
      } else if (query.includes('rule') || query.includes('guideline') || query.includes('schedule') || query.includes('faq')) {
        reply = `Here are the details for "${hackathon ? hackathon.name : 'the hackathon'}":
- Description: ${hackathon ? hackathon.description : 'A premier hackathon.'}
- Rules: ${hackathon ? hackathon.rules : 'Please check the announcements panel for detailed guidelines.'}`;
      } else if (query.includes('team') || query.includes('invite') || query.includes('member')) {
        reply = team 
          ? `You are in team "${team.name}". Invite code: "${team.inviteCode}". Members: ${team.members.map(m => m.name).join(', ')}.`
          : `You are not in a team yet. Please go to the Teams tab to create or join a team.`;
      } else if (query.includes('project') || query.includes('submit') || query.includes('repo')) {
        reply = project
          ? `Your project "${project.title}" status is: "${project.status}". GitHub: ${project.githubUrl || 'None'}, Demo: ${project.demoUrl || 'None'}.`
          : `No project has been submitted yet for your team. You can submit it via the Submit Project page.`;
      } else {
        reply = `Hi ${req.user.name}, the Gemini AI service is currently experiencing high traffic (503 Service Unavailable). Here is your context summary:
- Team: ${team ? team.name : 'None'}
- Project: ${project ? project.title : 'None'}
Please try again shortly, or ask about your "team", "project", or "rules"!`;
      }
    }

    // Create bot reply
    const botMsg = await ChatMessage.create({
      sender: req.user._id,
      senderName: 'HackGPT Assistant',
      senderRole: 'admin',
      body: reply.trim(),
      room: `chatbot-${req.user._id}`,
      aiGenerated: true,
    });

    // Send back both messages so frontend updates immediately
    res.status(201).json({ userMsg, botMsg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get messages for a room
router.get('/:room', auth, async (req, res) => {
  try {
    const { room } = req.params;

    // Room access validation
    if (room.startsWith('team-')) {
      const teamId = room.replace('team-', '');
      const isMember = await Team.findOne({ _id: teamId, members: req.user._id });
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied. You do not belong to this team.' });
      }
    } else if (room.startsWith('chatbot-')) {
      const userId = room.replace('chatbot-', '');
      if (req.user._id.toString() !== userId) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    } else if (room === 'instructions') {
      if (req.user.role !== 'admin' && req.user.role !== 'reviewer' && req.user.role !== 'organizer') {
        return res.status(403).json({ message: 'Access denied. Only Admins, Organizers, and Reviewers can access this chat.' });
      }
    }

    const messages = await ChatMessage.find({ room })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Post a message (also triggers safety checks for teams and Auto-reply for general)
router.post('/', auth, async (req, res) => {
  try {
    const { body, room, hackathonId } = req.body;

    // Room access validation
    if (room.startsWith('team-')) {
      const teamId = room.replace('team-', '');
      const isMember = await Team.findOne({ _id: teamId, members: req.user._id });
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    } else if (room.startsWith('chatbot-')) {
      return res.status(400).json({ message: 'Use /api/chat/bot endpoint for chatbot interaction.' });
    } else if (room === 'instructions') {
      if (req.user.role !== 'admin' && req.user.role !== 'reviewer' && req.user.role !== 'organizer') {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const msg = await ChatMessage.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      body,
      room,
      hackathonId,
    });

    req.io?.to(room).emit('chat-message', { ...msg.toObject(), senderName: req.user.name, senderRole: req.user.role });

    // Team chat safety checking
    if (room.startsWith('team-')) {
      const isMalicious = await checkMessageSafety(body);
      if (isMalicious) {
        const teamId = room.replace('team-', '');
        const teamObj = await Team.findById(teamId);
        const chatAlert = await ChatAlert.create({
          messageId: msg._id,
          teamId,
          teamName: teamObj ? teamObj.name : 'Unknown Team',
          senderId: req.user._id,
          senderName: req.user.name,
          messageBody: body,
          reason: 'Potential malicious/dangerous comments in team chat.',
        });
        // Emit to admins
        req.io?.to('admin-alerts').emit('chat-alert', chatAlert);
      }
    }

    // Auto-reply for general channel questions
    if (room === 'general' && body.includes('?') && req.user.role !== 'admin') {
      const aiReply = await callGemini(
        `You are a helpful hackathon assistant for "HackGPT". A participant asked: "${body}". Answer briefly and helpfully in 1-2 sentences. If it's about rules/schedule, say you'll notify the organizer. Be friendly and encouraging.`
      );
      if (aiReply) {
        const aiMsg = await ChatMessage.create({
          sender: req.user._id,
          senderName: 'HackGPT Assistant',
          senderRole: 'admin',
          body: aiReply.trim(),
          room,
          hackathonId,
          aiGenerated: true,
        });
        req.io?.to(room).emit('chat-message', { ...aiMsg.toObject(), senderName: 'HackGPT Assistant', senderRole: 'admin' });
      }
    }

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
