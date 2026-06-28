const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const User = require('../models/User');
const OtpCode = require('../models/OtpCode');
const RegistrationLog = require('../models/RegistrationLog');
const { detectDuplicate } = require('../services/ai/duplicateDetection');
const { extractSkills } = require('../services/ai/skillExtractor');
const { blacklistToken } = require('../middleware/auth');
const { sendOtpEmail, sendWelcomeEmail } = require('../services/emailService');
const { callGemini } = require('../services/gemini');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Send OTP to email before registration
const sendOtp = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !validator.isEmail(email))
      return res.status(400).json({ message: 'A valid email address is required.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });

    const code = crypto.randomInt(100000, 999999).toString();
    const hashed = await bcrypt.hash(code, 8);

    await OtpCode.deleteMany({ email: email.toLowerCase() });
    await OtpCode.create({
      email: email.toLowerCase(),
      code: hashed,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOtpEmail(email, code, name);
    res.json({ message: 'Verification code sent to your email.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send verification code.' });
  }
};

// Verify OTP code
const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required.' });

    const otpDoc = await OtpCode.findOne({ email: email.toLowerCase(), verified: false });
    if (!otpDoc) return res.status(400).json({ message: 'No pending verification found. Request a new code.' });

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ message: 'Code expired. Request a new one.' });
    }

    if (otpDoc.attempts >= 5) {
      await otpDoc.deleteOne();
      return res.status(429).json({ message: 'Too many failed attempts. Request a new code.' });
    }

    const match = await bcrypt.compare(code, otpDoc.code);
    if (!match) {
      otpDoc.attempts += 1;
      await otpDoc.save();
      return res.status(400).json({ message: `Incorrect code. ${5 - otpDoc.attempts} attempts remaining.` });
    }

    otpDoc.verified = true;
    await otpDoc.save();
    res.json({ message: 'Email verified successfully.' });
  } catch {
    res.status(500).json({ message: 'Verification failed.' });
  }
};

// Register new participant (OTP must be verified first)
const register = async (req, res) => {
  try {
    const { name, email, password, institution, university, bio, skills, domains, experience, githubUrl, linkedinUrl, demographics } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });

    if (!validator.isEmail(email))
      return res.status(400).json({ message: 'Invalid email address.' });

    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const otpDoc = await OtpCode.findOne({ email: email.toLowerCase(), verified: true });
    if (!otpDoc)
      return res.status(403).json({ message: 'Email not verified. Complete OTP verification first.' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered.' });

    const start = Date.now();
    const hashed = await bcrypt.hash(password, 12);

    const existingUsers = await User.find({ role: 'participant' }).select('name email institution');
    const dupResult = await detectDuplicate({ name, email, institution: institution || university }, existingUsers);
    const skillResult = await extractSkills(bio || '');

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashed,
      role: 'participant',
      emailVerified: true,
      institution: institution || university || '',
      university: university || institution || '',
      bio: bio || '',
      skills: skillResult.skills && skillResult.skills.length ? skillResult.skills : (Array.isArray(skills) ? skills : []),
      domains: skillResult.domains && skillResult.domains.length ? skillResult.domains : (Array.isArray(domains) ? domains : []),
      experience: skillResult.experience || experience || 'beginner',
      githubUrl: githubUrl || '',
      linkedinUrl: linkedinUrl || '',
      demographics: demographics || {},
      profileComplete: !!(name && (institution || university) && (skills?.length || skillResult.skills?.length)),
    });

    const processingMs = Date.now() - start;

    await RegistrationLog.create({
      userId: user._id,
      email: user.email,
      duplicateScore: dupResult.score || 0,
      duplicateOf: dupResult.matchedUserId || null,
      skillsExtracted: (skillResult.skills && skillResult.skills.length) ? skillResult.skills : (Array.isArray(skills) ? skills : []),
      domainsExtracted: (skillResult.domains && skillResult.domains.length) ? skillResult.domains : (Array.isArray(domains) ? domains : []),
      experienceClassified: skillResult.experience || experience || 'beginner',
      processingMs,
      aiProcessed: true,
      flagged: dupResult.isDuplicate || false,
      flagReason: dupResult.isDuplicate ? 'Levenshtein match — duplicate registration flagged' : '',
    });

    await otpDoc.deleteOne();
    sendWelcomeEmail(user.email, user.name).catch(() => {});

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Login — participants and reviewers only
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });

    if (user.role === 'admin') return res.status(403).json({ message: 'Admin accounts must use the organizer portal.' });

    if (!user.isActive) return res.status(403).json({ message: 'This account has been suspended.' });

    if (user.isLocked) return res.status(423).json({ message: 'Account locked due to too many failed attempts. Try again in 30 minutes.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Login failed.' });
  }
};

// Admin login — admin role only
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.role !== 'admin')
      return res.status(401).json({ message: 'Invalid organizer credentials.' });

    if (!user.isActive) return res.status(403).json({ message: 'Account suspended.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid organizer credentials.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Login failed.' });
  }
};

// Organizer/Reviewer login — organizer and reviewer roles
const organizerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || (user.role !== 'organizer' && user.role !== 'reviewer'))
      return res.status(401).json({ message: 'Invalid organizer or reviewer credentials.' });

    if (user.role === 'organizer' && user.verificationStatus !== 'approved') {
      return res.status(403).json({ message: `Your organizer account status is ${user.verificationStatus}. You will be allowed to log in once administrators approve your registration.` });
    }

    if (!user.isActive) return res.status(403).json({ message: 'Account suspended.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid organizer or reviewer credentials.' });

    user.lastLogin = new Date();
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ message: 'Login failed.' });
  }
};

// Register a new company organizer with dynamic AI screening
const registerOrganizer = async (req, res) => {
  try {
    const { name, email, password, companyName, website, companyDescription, employeeId, idCardImage } = req.body;
    
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ message: 'Name, email, password and company name are required.' });
    }

    if (!employeeId || !idCardImage) {
      return res.status(400).json({ message: 'Corporate employee ID number and ID card image upload are required.' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email is already registered.' });
    }

    const otpDoc = await OtpCode.findOne({ email: email.toLowerCase(), verified: true });
    if (!otpDoc) {
      return res.status(403).json({ message: 'Email not verified. Complete OTP verification first.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    // AI dynamic screening on company metadata via Gemini
    let aiScore = 50;
    let aiNotes = 'Dynamic AI screening failed to evaluate company metadata.';

    let imagePart = null;
    if (idCardImage) {
      if (idCardImage.startsWith('data:')) {
        const matches = idCardImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          imagePart = {
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          };
        }
      } else {
        imagePart = {
          inlineData: {
            mimeType: 'image/png',
            data: idCardImage
          }
        };
      }
    }

    try {
      const prompt = `Analyze the corporate organization, representative registration info, and the uploaded Employee ID card image:
      Company Name: "${companyName}"
      Website: "${website || 'Not provided'}"
      Description: "${companyDescription || 'Not provided'}"
      Representative Name: "${name}"
      Representative Email: "${email}"
      Representative Employee ID: "${employeeId}"

      Verification Tasks:
      1. Inspect the uploaded Employee ID card image. It MUST represent an official company employee ID card, badge, certificate, corporate document, or academic staff ID.
         - If the image is a landscape, mountain, abstract graphics, food, face-only photo without a card layout, or anything unrelated to a corporate/academic ID badge document, it is a FAKE card upload.
         - OCR and match check: Extract the text from the card image and compare it with the registration details:
           * Verify if the company name displayed on the card matches or aligns with the submitted Company Name: "${companyName}".
           * Verify if the representative's name displayed on the card matches or aligns with the submitted Representative Name: "${name}".
           * Verify if the employee ID number displayed on the card matches or aligns with the submitted Representative Employee ID: "${employeeId}".
         - If there is a clear mismatch (e.g., the ID card belongs to a different company, has a different name, or lists a different ID number), assign a score of 15 and reasoning: "FAILED: ID card details (company name, representative name, or ID number) do not match the registration form fields."
         - If the ID card is invalid or fake, assign a score of 10 and reasoning: "FAILED: Invalid/Fake employee ID card image uploaded."
      2. Check if the representative's email domain (e.g. gmail.com, company.com) aligns with the company name and website domain.
         - Generic public email domains (gmail.com, yahoo.com, outlook.com, live.com, hotmail.com, qq.com, etc.) used for a formal company registration are a security risk. Flag this unless it represents a grassroots community or indie developer.
      3. Evaluate if the company description and website represent a real tech/development/educational entity capable of hosting events.

      If checks pass (valid corporate ID card matching the representative's name, company, and ID number; matching official email; valid description/website), assign a score between 75 and 100.
      If the ID card is invalid, OR if there is a mismatch in names/IDs, OR if there is a severe mismatch/generic email claiming to represent a corporation, assign a score below 30 (fails screening).

      Respond ONLY in the following JSON format:
      {"score": <number between 0 and 100>, "reasoning": "<short description of the evaluation highlighting ID card details matching, validity, alignment, domain matches, and generic email flags>"}
      Do not include any explanation or extra markdown wrappers outside of JSON.`;

      const responseText = await callGemini(prompt, imagePart);
      if (responseText) {
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanJson);
        if (result && typeof result.score === 'number') {
          aiScore = result.score;
          aiNotes = result.reasoning || '';
        }
      } else {
        // Fallback rule-based check if API is rate-limited, key fails, or quota is exceeded
        const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'qq.com', 'mail.ru', 'icloud.com', 'protonmail.com'];
        const isGenericEmail = genericDomains.some(d => email.toLowerCase().endsWith('@' + d));
        const websiteDomain = website ? website.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : '';
        const emailDomain = email.split('@')[1];
        const domainsAlign = websiteDomain && emailDomain && (
          emailDomain.toLowerCase().includes(websiteDomain.toLowerCase()) || 
          websiteDomain.toLowerCase().includes(emailDomain.toLowerCase())
        );

        if (isGenericEmail) {
          aiScore = 20;
          aiNotes = "Verification failed: A generic/public email domain was used for a corporate organizer registration, posing high impersonation risk.";
        } else if (website && !domainsAlign) {
          aiScore = 35;
          aiNotes = "Verification warning: Representative email domain does not align with the provided corporate website.";
        } else {
          aiScore = 55;
          aiNotes = "Verification: Registration metadata format is valid. (Automated multimodal ID and domain inspection could not be completed via Gemini).";
        }
      }
    } catch (err) {
      console.error('Gemini organizer screening error:', err);
      // Fallback rule-based check in case of code execution errors/exceptions
      const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'qq.com', 'mail.ru', 'icloud.com', 'protonmail.com'];
      const isGenericEmail = genericDomains.some(d => email.toLowerCase().endsWith('@' + d));
      if (isGenericEmail) {
        aiScore = 20;
        aiNotes = "Verification failed: A generic/public email domain was used for a corporate organizer registration, posing high impersonation risk.";
      } else {
        aiScore = 45;
        aiNotes = "Verification: Metadata format check. (Gemini screening encountered an exception: " + err.message + ")";
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashed,
      role: 'organizer',
      companyName: companyName.trim(),
      website: website ? website.trim() : '',
      companyDescription: companyDescription ? companyDescription.trim() : '',
      employeeId: employeeId.trim(),
      idCardImage: idCardImage,
      verificationStatus: 'pending',
      aiVerificationScore: aiScore,
      aiVerificationNotes: aiNotes,
      emailVerified: true,
    });

    await otpDoc.deleteOne();

    res.status(201).json({
      message: 'Organizer account registered. Your application is pending validation by the system administrators.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Logout — blacklist token
const logout = (req, res) => {
  if (req.token) blacklistToken(req.token);
  res.json({ message: 'Logged out successfully.' });
};

// Get current user
const me = (req, res) => res.json(req.user);

module.exports = { sendOtp, verifyOtp, register, login, adminLogin, organizerLogin, registerOrganizer, logout, me };

