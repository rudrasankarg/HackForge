const Assignment = require('../../models/Assignment');
const Evaluation = require('../../models/Evaluation');
const User = require('../../models/User');
const Project = require('../../models/Project');
const { sendEmail } = require('../emailService');
const { scoreAssignment } = require('./reviewerAssignment');

// Dynamic Reassignment Check
// Threshold defaults to 24 hours (86400000 ms), but can be adjusted for demo purposes
const runReassignmentChecks = async (inactivityThresholdMs = 24 * 60 * 60 * 1000) => {
  try {
    console.log('[REASSIGNMENT ENGINE] Starting checks...');
    const now = new Date();
    
    // Find all assignments
    const assignments = await Assignment.find()
      .populate('reviewerId')
      .populate('projectId');

    // Find all completed evaluations
    const evaluations = await Evaluation.find({ status: 'completed' });
    const evaluatedPairs = new Set(
      evaluations.map(e => `${e.reviewerId.toString()}_${e.projectId.toString()}`)
    );

    // Filter assignments that are pending evaluation
    const pendingAssignments = assignments.filter(a => {
      if (!a.reviewerId || !a.projectId) return false;
      const key = `${a.reviewerId._id.toString()}_${a.projectId._id.toString()}`;
      return !evaluatedPairs.has(key);
    });

    let reassignmentCount = 0;

    for (const assignment of pendingAssignments) {
      const reviewer = assignment.reviewerId;
      const project = assignment.projectId;

      // Check if reviewer has been inactive (lastActive is older than threshold)
      // or if assignment itself was created older than threshold
      const assignmentAgeMs = now.getTime() - new Date(assignment.createdAt || now).getTime();
      const reviewerInactivityMs = now.getTime() - new Date(reviewer.lastActive || reviewer.updatedAt || now).getTime();

      const isNoShow = assignmentAgeMs > inactivityThresholdMs || reviewerInactivityMs > inactivityThresholdMs;

      if (isNoShow) {
        console.log(`[REASSIGNMENT ENGINE] No-show detected: Reviewer ${reviewer.name} for project "${project.title}" (Age: ${Math.round(assignmentAgeMs/3600000)}h, Inactive: ${Math.round(reviewerInactivityMs/3600000)}h)`);

        // Find alternative reviewers
        const reviewers = await User.find({ role: 'reviewer', isActive: true, _id: { $ne: reviewer._id } });
        if (reviewers.length === 0) {
          console.log('[REASSIGNMENT ENGINE] No alternative reviewers available.');
          continue;
        }

        // Get current workload (assignment counts) for all active reviewers
        const reviewerCounts = {};
        for (const rev of reviewers) {
          reviewerCounts[rev._id.toString()] = await Assignment.countDocuments({ reviewerId: rev._id });
        }

        // Find candidates that do not have conflict of interest
        // Populate team members to do proper institutional/email checks
        const populatedProject = await Project.findById(project._id).populate('teamMembers');
        const teamInstitution = populatedProject?.teamInstitution || '';
        
        const candidates = [];
        for (const rev of reviewers) {
          // Check existing assignments for this project to avoid double assignment
          const alreadyAssigned = await Assignment.findOne({ reviewerId: rev._id, projectId: project._id });
          if (alreadyAssigned) continue;

          // Conflict detection
          const isConflict = rev.institution && teamInstitution &&
            rev.institution.toLowerCase() === teamInstitution.toLowerCase();
          
          if (isConflict) continue;

          // Workload: check if workload score is acceptable
          const assignmentScoreObj = scoreAssignment(rev, project, reviewerCounts);
          candidates.push({
            reviewer: rev,
            score: assignmentScoreObj.total,
            workload: reviewerCounts[rev._id.toString()] || 0
          });
        }

        if (candidates.length === 0) {
          console.log(`[REASSIGNMENT ENGINE] No eligible alternative reviewers without conflicts found for project "${project.title}"`);
          continue;
        }

        // Sort candidates: lowest workload first, then highest match score
        candidates.sort((a, b) => {
          if (a.workload !== b.workload) return a.workload - b.workload;
          return b.score - a.score;
        });

        const newReviewerObj = candidates[0];
        const newReviewer = newReviewerObj.reviewer;

        console.log(`[REASSIGNMENT ENGINE] Reassigning project "${project.title}" from ${reviewer.name} to ${newReviewer.name} (Workload: ${newReviewerObj.workload}, Score: ${newReviewerObj.score.toFixed(3)})`);

        // Perform update
        assignment.reviewerId = newReviewer._id;
        assignment.assignedBy = 'ai_reassigned';
        assignment.confidence = newReviewerObj.score;
        assignment.assignedAt = new Date();
        await assignment.save();

        reassignmentCount++;

        // Send Email Notification to new Reviewer
        const reviewerHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px; color: #111827; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div style="margin-bottom: 24px;">
              <span style="font-size: 20px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">HackForge</span>
            </div>
            <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 24px;"></div>
            <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">New Project Reassigned to You</h2>
            <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 16px 0;">Hello ${newReviewer.name},</p>
            <p style="font-size: 15px; line-height: 24px; color: #374151; margin: 0 0 24px 0;">The project <strong>"${project.title}"</strong> has been dynamically reassigned to you due to queue rebalancing. Please review the project details and submit your scores at your earliest convenience.</p>
            <div style="margin-bottom: 24px;">
              <a href="https://hackforge-4s9q.onrender.com/reviewers" style="display: inline-block; background-color: #ea580c; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px;">View Assigned Projects</a>
            </div>
            <div style="height: 1px; background-color: #e5e7eb; margin-top: 24px; margin-bottom: 16px;"></div>
            <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0;">HackForge Platform</p>
          </div>
        `;
        await sendEmail(
          newReviewer.email,
          `HackForge — New Project Assignment: ${project.title}`,
          reviewerHtml,
          'announcement',
          true // Send immediately
        );
      }
    }

    console.log(`[REASSIGNMENT ENGINE] Completed checks. Total projects reassigned: ${reassignmentCount}`);
    return reassignmentCount;
  } catch (err) {
    console.error('[REASSIGNMENT ENGINE ERROR] Error running checks:', err.message);
    throw err;
  }
};

module.exports = { runReassignmentChecks };
