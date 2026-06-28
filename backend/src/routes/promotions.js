const router = require('express').Router();
const PromotionCampaign = require('../models/PromotionCampaign');
const { auth, requireRole } = require('../middleware/auth');
const { callGemini } = require('../services/gemini');

// 1. Generate Promotional Content with Gemini
router.post('/generate', auth, requireRole('admin', 'organizer'), async (req, res) => {
  const { topic, channel, audience, abTest = false } = req.body;
  if (!topic || !channel) {
    return res.status(400).json({ message: 'Topic and channel are required.' });
  }

  try {
    const promptA = `You are a growth marketing copywriter. Create a highly engaging promotional message for a hackathon.
Channel: ${channel}
Target Audience: ${audience || 'all hackers'}
Topic/Theme: "${topic}"

Rules:
- If email, start with "Subject: [engaging subject line]" then a blank line. Keep email body under 120 words.
- If slack, keep it under 80 words, use slack markdown (bold, list, emojis).
- If twitter, keep it under 280 characters with hashtags.
- If linkedin, keep it professional and structured with bullet points.
- Always include the platform link: https://hackforge-4s9q.onrender.com

Write only the promotional copy.`;

    const contentA = await callGemini(promptA);
    if (!contentA) {
      return res.status(500).json({ message: 'AI generation failed. Please try again.' });
    }

    let contentB = '';
    if (abTest) {
      const promptB = `You are a growth marketing copywriter. Create a SECOND, alternative promotional message for a hackathon (Variant B for A/B testing) that uses a completely different hook or tone (e.g. highly energetic vs. professional/structured) compared to standard messaging.
Channel: ${channel}
Target Audience: ${audience || 'all hackers'}
Topic/Theme: "${topic}"

Rules:
- If email, start with "Subject: [engaging subject line]" then a blank line. Keep email body under 120 words.
- If slack, keep it under 80 words, use slack markdown.
- If twitter, keep it under 280 characters.
- If linkedin, keep it under 150 words.
- Always include the platform link: https://hackforge-4s9q.onrender.com

Write only the promotional copy.`;
      contentB = await callGemini(promptB) || '';
    }

    // Extract subject for email
    let subject = '';
    let cleanA = contentA.trim();
    let cleanB = contentB.trim();

    if (channel === 'email') {
      const matchA = cleanA.match(/^Subject:\s*(.+)$/m);
      if (matchA) {
        subject = matchA[1];
        cleanA = cleanA.replace(/^Subject:\s*.+$/m, '').trim();
      }
      const matchB = cleanB.match(/^Subject:\s*(.+)$/m);
      if (matchB) {
        cleanB = cleanB.replace(/^Subject:\s*.+$/m, '').trim();
      }
    }

    res.json({
      subject,
      contentA: cleanA,
      contentB: cleanB,
      abTestEnabled: abTest
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. Save A/B Test Campaign
router.post('/ab-test', auth, requireRole('admin', 'organizer'), async (req, res) => {
  const { title, channel, subject, contentA, contentB, abTestEnabled, audience } = req.body;
  if (!title || !contentA) {
    return res.status(400).json({ message: 'Title and content A are required.' });
  }

  try {
    // Generate realistic simulated metrics
    const baseSent = Math.floor(Math.random() * 200) + 150;
    const clicksA = Math.floor(baseSent * (Math.random() * 0.15 + 0.10));
    const clicksB = abTestEnabled ? Math.floor(baseSent * (Math.random() * 0.18 + 0.12)) : 0;
    const opensA = Math.floor(baseSent * (Math.random() * 0.20 + 0.50));
    const opensB = abTestEnabled ? Math.floor(baseSent * (Math.random() * 0.25 + 0.55)) : 0;
    const impressions = baseSent * (channel === 'twitter' || channel === 'linkedin' ? 12 : 1);

    const campaign = new PromotionCampaign({
      title,
      channel,
      subject,
      contentA,
      contentB,
      abTestEnabled,
      audience,
      status: 'active',
      metrics: {
        sent: baseSent,
        clicksA,
        clicksB,
        opensA,
        opensB,
        impressions
      }
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. Get Campaigns & Performance
router.get('/performance', auth, requireRole('admin', 'organizer'), async (req, res) => {
  try {
    const campaigns = await PromotionCampaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
