const Ticket = require('../models/Ticket');

// Create a new support ticket
const createTicket = async (req, res) => {
  try {
    let { subject, category, description, hackathonId } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required.' });
    }

    if (hackathonId === 'website' || hackathonId === '') {
      hackathonId = null;
    }

    if (req.user.role === 'participant' && hackathonId) {
      const Team = require('../models/Team');
      const team = await Team.findOne({ hackathonId, members: req.user._id });
      if (!team) {
        return res.status(400).json({ message: 'You must be in a team to raise a ticket for this hackathon.' });
      }
    }

    const ticket = await Ticket.create({
      userId: req.user._id,
      hackathonId: hackathonId || null,
      subject,
      category: category || 'technical',
      description,
      status: 'open'
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('userId', 'name email role')
      .populate('hackathonId', 'nameTheme name');

    res.status(201).json(populatedTicket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get tickets (admins see all, users see their own, organizers/reviewers scoped by hackathon)
const getTickets = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'admin') {
      filter = {};
    } else if (req.user.role === 'organizer') {
      const Hackathon = require('../models/Hackathon');
      const myHackathons = await Hackathon.find({ createdBy: req.user._id }).select('_id');
      const myHackonIds = myHackathons.map(h => h._id);
      filter = { hackathonId: { $in: myHackonIds } };
    } else if (req.user.role === 'reviewer') {
      const Assignment = require('../models/Assignment');
      const reviewerAssignments = await Assignment.find({ reviewerId: req.user._id }).select('hackathonId');
      const assignedHackonIds = [...new Set(reviewerAssignments.map(a => a.hackathonId.toString()))];
      filter = { hackathonId: { $in: assignedHackonIds } };
    } else {
      filter = { userId: req.user._id };
    }

    // Filter by hackathonId query parameter if provided
    if (req.query.hackathonId) {
      if (req.query.hackathonId === 'website') {
        if (req.user.role === 'organizer' || req.user.role === 'reviewer') {
          return res.status(403).json({ message: 'Access denied to Website/Platform tickets.' });
        }
        filter.hackathonId = null;
      } else {
        if (req.user.role === 'organizer') {
          const Hackathon = require('../models/Hackathon');
          const h = await Hackathon.findOne({ _id: req.query.hackathonId, createdBy: req.user._id });
          if (!h) return res.status(403).json({ message: 'Access denied to this hackathon.' });
        } else if (req.user.role === 'reviewer') {
          const Assignment = require('../models/Assignment');
          const assigned = await Assignment.findOne({ reviewerId: req.user._id, hackathonId: req.query.hackathonId });
          if (!assigned) return res.status(403).json({ message: 'Access denied to this hackathon.' });
        }
        filter.hackathonId = req.query.hackathonId;
      }
    }

    const tickets = await Ticket.find(filter)
      .populate('userId', 'name email role')
      .populate('hackathonId', 'nameTheme name')
      .sort({ updatedAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a single ticket
const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('replies.sender', 'name email role');
    
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    // Restrict access
    if (req.user.role === 'admin') {
      // Allowed
    } else if (!ticket.hackathonId) {
      // Website-wide ticket, only creator and admins allowed
      if (ticket.userId._id.toString() !== req.user._id.toString() && ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    } else if (req.user.role === 'organizer') {
      const Hackathon = require('../models/Hackathon');
      const h = await Hackathon.findOne({ _id: ticket.hackathonId, createdBy: req.user._id });
      if (!h) return res.status(403).json({ message: 'Access denied.' });
    } else if (req.user.role === 'reviewer') {
      const Assignment = require('../models/Assignment');
      const assigned = await Assignment.findOne({ reviewerId: req.user._id, hackathonId: ticket.hackathonId });
      if (!assigned) return res.status(403).json({ message: 'Access denied.' });
    } else {
      // Participant must be owner
      if (ticket.userId._id.toString() !== req.user._id.toString() && ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a reply/comment to a ticket
const replyTicket = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ message: 'Reply body is required.' });

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    // Restrict access
    if (req.user.role === 'admin') {
      // Allowed
    } else if (!ticket.hackathonId) {
      // Website-wide ticket, only creator and admins allowed
      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    } else if (req.user.role === 'organizer') {
      const Hackathon = require('../models/Hackathon');
      const h = await Hackathon.findOne({ _id: ticket.hackathonId, createdBy: req.user._id });
      if (!h) return res.status(403).json({ message: 'Access denied.' });
    } else if (req.user.role === 'reviewer') {
      const Assignment = require('../models/Assignment');
      const assigned = await Assignment.findOne({ reviewerId: req.user._id, hackathonId: ticket.hackathonId });
      if (!assigned) return res.status(403).json({ message: 'Access denied.' });
    } else {
      if (ticket.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const reply = {
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      body,
      createdAt: new Date()
    };

    ticket.replies.push(reply);

    // Auto update status: if admin/mentor replies, set to in-progress
    if (['admin', 'organizer', 'reviewer'].includes(req.user.role) && ticket.status === 'open') {
      ticket.status = 'in-progress';
    }

    await ticket.save();

    // Populate reply sender details before returning
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('userId', 'name email role')
      .populate('replies.sender', 'name email role');

    res.json(updatedTicket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update status of a ticket (admin, organizer, reviewer only, scoped by hackathon)
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'in-progress', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found.' });

    // Restrict access
    if (req.user.role === 'admin') {
      // Allowed
    } else if (!ticket.hackathonId) {
      // Website-wide ticket, only creator and admins allowed
      return res.status(403).json({ message: 'Access denied.' });
    } else if (req.user.role === 'organizer') {
      const Hackathon = require('../models/Hackathon');
      const h = await Hackathon.findOne({ _id: ticket.hackathonId, createdBy: req.user._id });
      if (!h) return res.status(403).json({ message: 'Access denied.' });
    } else if (req.user.role === 'reviewer') {
      const Assignment = require('../models/Assignment');
      const assigned = await Assignment.findOne({ reviewerId: req.user._id, hackathonId: ticket.hackathonId });
      if (!assigned) return res.status(403).json({ message: 'Access denied.' });
    } else {
      return res.status(403).json({ message: 'Access denied.' });
    }

    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicket,
  replyTicket,
  updateTicketStatus
};
