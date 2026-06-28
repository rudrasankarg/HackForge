require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Evaluation = require('../models/Evaluation');
const Assignment = require('../models/Assignment');
const Announcement = require('../models/Announcement');
const ChatMessage = require('../models/ChatMessage');
const BiasAlert = require('../models/BiasAlert');
const RegistrationLog = require('../models/RegistrationLog');
const AiJuryDebate = require('../models/AiJuryDebate');
const CheatShieldLog = require('../models/CheatShieldLog');
const AiVideoSentiment = require('../models/AiVideoSentiment');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackforge';

const hash = (p) => bcrypt.hashSync(p, 10);

async function seed(skipConnect = false) {
  if (!skipConnect) {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB — seeding...');
  }

  // Check if database already has users
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already contains users. Skipping seed to preserve data.');
    if (!skipConnect) {
      await mongoose.disconnect();
      process.exit(0);
    }
    return;
  }

  // Wipe existing data
  await Promise.all([
    User.deleteMany(), Hackathon.deleteMany(), Project.deleteMany(), Team.deleteMany(),
    Evaluation.deleteMany(), Assignment.deleteMany(), Announcement.deleteMany(),
    ChatMessage.deleteMany(), BiasAlert.deleteMany(), RegistrationLog.deleteMany(),
    AiJuryDebate.deleteMany(), CheatShieldLog.deleteMany(), AiVideoSentiment.deleteMany(),
  ]);

  try {
    await User.collection.dropIndexes();
  } catch (err) {
    // Collection might not exist yet, ignore
  }

  
  const admins = await User.insertMany([
    { name: 'Priya Sharma', email: 'admin@hackforge.dev', password: hash('Admin@123'), role: 'admin', institution: 'HackForge HQ', bio: 'Platform organiser', skills: ['Management', 'Strategy'], experience: 'expert', emailVerified: true, isActive: true, demographics: { gender: 'female', country: 'India', ageGroup: '25-34' } },
    { name: 'Rahul Mehta', email: 'rahul@hackforge.dev', password: hash('Admin@123'), role: 'admin', institution: 'HackForge HQ', bio: 'Technical lead', skills: ['DevOps', 'Architecture'], experience: 'expert', emailVerified: true, isActive: true, demographics: { gender: 'male', country: 'India', ageGroup: '25-34' } },
    { name: 'Sarah Chen', email: 'sarah@hackforge.dev', password: hash('Admin@123'), role: 'admin', institution: 'HackForge HQ', bio: 'UX Director', skills: ['Design', 'Research'], experience: 'expert', emailVerified: true, isActive: true, demographics: { gender: 'female', country: 'Singapore', ageGroup: '25-34' } },
  ]);

  
  const reviewerData = [
    { name: 'Dr. Arjun Nair', email: 'arjun.reviewer@hackgpt.dev', bio: 'PhD in Machine Learning, 8 years in AI research, published 20+ papers on deep learning and NLP', skills: ['Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Python'], domains: ['Machine Learning', 'Data Science'], institution: 'IIT Bombay', demographics: { gender: 'male', country: 'India', ageGroup: '35-44' } },
    { name: 'Emily Rodriguez', email: 'emily.reviewer@hackgpt.dev', bio: 'Senior Full-Stack Engineer at Google, React and Node.js expert, 6 years building scalable web apps', skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'AWS'], domains: ['Web Development', 'Backend'], institution: 'Google', demographics: { gender: 'female', country: 'USA', ageGroup: '25-34' } },
    { name: 'Kwame Asante', email: 'kwame.reviewer@hackgpt.dev', bio: 'Mobile architect at Spotify, Flutter and iOS specialist, 7 years building consumer apps with 10M+ users', skills: ['Flutter', 'Swift', 'Kotlin', 'Firebase', 'iOS'], domains: ['Mobile Development'], institution: 'Spotify', demographics: { gender: 'male', country: 'Ghana', ageGroup: '25-34' } },
    { name: 'Mei Lin Zhang', email: 'mei.reviewer@hackgpt.dev', bio: 'Principal DevOps Engineer, Kubernetes and cloud infrastructure expert, 9 years in distributed systems', skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'CI/CD'], domains: ['DevOps'], institution: 'Amazon', demographics: { gender: 'female', country: 'China', ageGroup: '35-44' } },
    { name: 'Lucas Fernandez', email: 'lucas.reviewer@hackgpt.dev', bio: 'Blockchain developer and smart contract auditor, Ethereum and Solana expert, 5 years in Web3', skills: ['Solidity', 'Ethereum', 'Web3.js', 'Rust', 'Smart Contracts'], domains: ['Blockchain'], institution: 'Coinbase', demographics: { gender: 'male', country: 'Brazil', ageGroup: '25-34' } },
    { name: 'Dr. Fatima Al-Rashidi', email: 'fatima.reviewer@hackgpt.dev', bio: 'Cybersecurity researcher, penetration testing expert, 10 years in threat intelligence and vulnerability research', skills: ['Cybersecurity', 'Penetration Testing', 'Python', 'Cryptography', 'SIEM'], domains: ['Security'], institution: 'MIT Lincoln Laboratory', demographics: { gender: 'female', country: 'UAE', ageGroup: '35-44' } },
    { name: 'James Okafor', email: 'james.reviewer@hackgpt.dev', bio: 'Data Science lead at Netflix, specialises in recommendation systems and predictive analytics, 7 years experience', skills: ['Python', 'Pandas', 'SQL', 'Tableau', 'Statistics'], domains: ['Data Science'], institution: 'Netflix', demographics: { gender: 'male', country: 'Nigeria', ageGroup: '25-34' } },
    { name: 'Ananya Krishnan', email: 'ananya.reviewer@hackgpt.dev', bio: 'Product designer turned engineer, Figma expert, designs for accessibility and inclusion, 6 years in product', skills: ['Figma', 'UI/UX', 'React', 'Design Systems', 'User Research'], domains: ['UI/UX Design', 'Web Development'], institution: 'Microsoft', demographics: { gender: 'female', country: 'India', ageGroup: '25-34' } },
  ];

  const reviewers = await User.insertMany(
    reviewerData.map((r) => ({ ...r, password: hash('Review@123'), role: 'reviewer', experience: 'expert', emailVerified: true, isActive: true }))
  );

  
  const participantData = [
    { name: 'Aarav Patel', email: 'aarav@student.iitd.ac.in', bio: 'Final year CSE student, React and ML enthusiast, built 3 full-stack projects', institution: 'IIT Delhi', skills: ['React', 'Python', 'Machine Learning'], domains: ['Web Development', 'Machine Learning'], experience: 'intermediate', demographics: { gender: 'male', country: 'India', ageGroup: '18-24' } },
    { name: 'Zara Ahmed', email: 'zara@bits.ac.in', bio: 'Computer Science sophomore, passionate about mobile apps and UI design, learning Flutter', institution: 'BITS Pilani', skills: ['Flutter', 'Figma', 'Dart'], domains: ['Mobile Development', 'UI/UX Design'], experience: 'beginner', demographics: { gender: 'female', country: 'India', ageGroup: '18-24' } },
    { name: 'Carlos Mendez', email: 'carlos@unam.mx', bio: 'Backend developer, Node.js and PostgreSQL expert, 2 years building REST APIs for startups', institution: 'UNAM', skills: ['Node.js', 'PostgreSQL', 'Docker'], domains: ['Backend'], experience: 'intermediate', demographics: { gender: 'male', country: 'Mexico', ageGroup: '18-24' } },
    { name: 'Aisha Okonkwo', email: 'aisha@unilag.edu.ng', bio: 'Cybersecurity student, CTF competitor, interested in ethical hacking and network security', institution: 'University of Lagos', skills: ['Python', 'Linux', 'Cybersecurity', 'Networking'], domains: ['Security'], experience: 'intermediate', demographics: { gender: 'female', country: 'Nigeria', ageGroup: '18-24' } },
    { name: 'Hiroshi Tanaka', email: 'hiroshi@titech.ac.jp', bio: 'Robotics and embedded systems enthusiast, Arduino and ROS expert, working on autonomous navigation', institution: 'Tokyo Institute of Technology', skills: ['C++', 'ROS', 'Python', 'Arduino'], domains: ['Machine Learning'], experience: 'intermediate', demographics: { gender: 'male', country: 'Japan', ageGroup: '18-24' } },
    { name: 'Sofia Nguyen', email: 'sofia@hcmut.edu.vn', bio: 'Data science enthusiast, building predictive models for healthcare, Kaggle competitions', institution: 'HCMC University of Technology', skills: ['Python', 'Pandas', 'TensorFlow', 'SQL'], domains: ['Data Science', 'Machine Learning'], experience: 'intermediate', demographics: { gender: 'female', country: 'Vietnam', ageGroup: '18-24' } },
    { name: 'Marcus Johnson', email: 'marcus@mit.edu', bio: 'MIT sophomore studying AI, working on NLP projects and transformer models, strong math background', institution: 'MIT', skills: ['Python', 'PyTorch', 'NLP', 'Transformers'], domains: ['Machine Learning', 'Data Science'], experience: 'intermediate', demographics: { gender: 'male', country: 'USA', ageGroup: '18-24' } },
    { name: 'Pritha Roy', email: 'pritha@jadavpur.ac.in', bio: 'Web developer with React and Next.js, built e-commerce sites, learning cloud deployment', institution: 'Jadavpur University', skills: ['React', 'Next.js', 'CSS', 'JavaScript'], domains: ['Web Development'], experience: 'intermediate', demographics: { gender: 'female', country: 'India', ageGroup: '18-24' } },
    { name: 'Ali Hassan', email: 'ali@nust.edu.pk', bio: 'Blockchain developer, built DeFi protocols, smart contract security researcher', institution: 'NUST', skills: ['Solidity', 'Web3.js', 'Ethereum', 'JavaScript'], domains: ['Blockchain'], experience: 'intermediate', demographics: { gender: 'male', country: 'Pakistan', ageGroup: '18-24' } },
    { name: 'Elena Popescu', email: 'elena@polytechnica.ro', bio: 'DevOps and cloud enthusiast, AWS certified, Kubernetes administrator, CI/CD pipelines', institution: 'Politehnica Bucharest', skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform'], domains: ['DevOps'], experience: 'intermediate', demographics: { gender: 'female', country: 'Romania', ageGroup: '18-24' } },
    { name: 'Kabir Singh', email: 'kabir@iitk.ac.in', bio: 'IIT Kanpur, competitive programmer, building a distributed database system for my thesis', institution: 'IIT Kanpur', skills: ['C++', 'Go', 'Distributed Systems', 'Algorithms'], domains: ['Backend'], experience: 'expert', demographics: { gender: 'male', country: 'India', ageGroup: '18-24' } },
    { name: 'Amara Diallo', email: 'amara@ucad.sn', bio: 'Mobile developer, Android and cross-platform apps, building fintech solutions for West Africa', institution: 'Université Cheikh Anta Diop', skills: ['Android', 'Kotlin', 'React Native', 'Firebase'], domains: ['Mobile Development'], experience: 'intermediate', demographics: { gender: 'female', country: 'Senegal', ageGroup: '18-24' } },
    { name: 'Ryan Kim', email: 'ryan@kaist.ac.kr', bio: 'Computer vision researcher, GANs and image segmentation, published at CVPR workshop', institution: 'KAIST', skills: ['Python', 'OpenCV', 'PyTorch', 'Computer Vision'], domains: ['Machine Learning'], experience: 'expert', demographics: { gender: 'male', country: 'South Korea', ageGroup: '18-24' } },
    { name: 'Fatou Sy', email: 'fatou@esp.sn', bio: 'Web developer learning React and Python, building apps for agriculture in rural Senegal', institution: 'ESP Dakar', skills: ['HTML', 'CSS', 'JavaScript', 'Python'], domains: ['Web Development'], experience: 'beginner', demographics: { gender: 'female', country: 'Senegal', ageGroup: '18-24' } },
    { name: 'Daniel Osei', email: 'daniel@knust.edu.gh', bio: 'Full-stack developer, Node and Vue.js, built 5 production apps, passionate about EdTech', institution: 'KNUST', skills: ['Vue.js', 'Node.js', 'MongoDB', 'Express'], domains: ['Web Development', 'Backend'], experience: 'intermediate', demographics: { gender: 'male', country: 'Ghana', ageGroup: '18-24' } },
    { name: 'Nina Petrov', email: 'nina@spbpu.ru', bio: 'ML researcher focusing on federated learning and privacy-preserving AI, 3 publications', institution: 'St. Petersburg Polytechnic', skills: ['Python', 'TensorFlow', 'Federated Learning', 'Privacy'], domains: ['Machine Learning'], experience: 'expert', demographics: { gender: 'female', country: 'Russia', ageGroup: '18-24' } },
    { name: 'Yusuf Abdullahi', email: 'yusuf@abu.edu.ng', bio: 'Cybersecurity and ethical hacking, network security engineer, built intrusion detection system', institution: 'Ahmadu Bello University', skills: ['Python', 'Wireshark', 'Metasploit', 'Linux'], domains: ['Security'], experience: 'intermediate', demographics: { gender: 'male', country: 'Nigeria', ageGroup: '18-24' } },
    { name: 'Isabel Torres', email: 'isabel@uc.cl', bio: 'UX/UI designer and frontend developer, accessibility advocate, builds inclusive web experiences', institution: 'Universidad de Chile', skills: ['Figma', 'React', 'CSS', 'Accessibility'], domains: ['UI/UX Design', 'Web Development'], experience: 'intermediate', demographics: { gender: 'female', country: 'Chile', ageGroup: '18-24' } },
    { name: 'Nikhil Joshi', email: 'nikhil@coep.ac.in', bio: 'IoT developer, smart home automation, MQTT and ESP32, integrating ML at the edge', institution: 'COEP', skills: ['IoT', 'C++', 'Python', 'MQTT', 'ESP32'], domains: ['Machine Learning'], experience: 'intermediate', demographics: { gender: 'male', country: 'India', ageGroup: '18-24' } },
    { name: 'Chioma Eze', email: 'chioma@unn.edu.ng', bio: 'Data analyst, SQL and Power BI, building dashboards for healthcare resource management in Nigeria', institution: 'UNN', skills: ['SQL', 'Power BI', 'Python', 'Excel'], domains: ['Data Science'], experience: 'beginner', demographics: { gender: 'female', country: 'Nigeria', ageGroup: '18-24' } },
    { name: 'Mikhail Volkov', email: 'mikhail@msu.ru', bio: 'Competitive programmer, ACM ICPC finalist, expert in algorithms and optimization, C++ specialist', institution: 'Moscow State University', skills: ['C++', 'Algorithms', 'Data Structures', 'Mathematics'], domains: ['Backend'], experience: 'expert', demographics: { gender: 'male', country: 'Russia', ageGroup: '18-24' } },
    { name: 'Jasmine Wong', email: 'jasmine@hku.hk', bio: 'Product designer, 2 internships at Hong Kong startups, user research and prototyping in Figma', institution: 'HKU', skills: ['Figma', 'User Research', 'Prototyping', 'Sketch'], domains: ['UI/UX Design'], experience: 'intermediate', demographics: { gender: 'female', country: 'Hong Kong', ageGroup: '18-24' } },
    { name: 'Emeka Nwosu', email: 'emeka@futa.edu.ng', bio: 'Android developer, built 4 published apps on Play Store, Firebase and REST API integration', institution: 'FUTA', skills: ['Android', 'Kotlin', 'Firebase', 'REST API'], domains: ['Mobile Development'], experience: 'intermediate', demographics: { gender: 'male', country: 'Nigeria', ageGroup: '18-24' } },
    { name: 'Laura Becker', email: 'laura@tum.de', bio: 'Computer Science masters student at TUM, specialising in distributed systems and cloud computing', institution: 'TU Munich', skills: ['Java', 'Spring Boot', 'Kafka', 'GCP'], domains: ['Backend', 'DevOps'], experience: 'intermediate', demographics: { gender: 'female', country: 'Germany', ageGroup: '18-24' } },
    { name: 'Raj Vardhan', email: 'raj@vit.ac.in', bio: 'Full-stack dev, MERN stack expert, built 8 freelance projects, looking to break into product development', institution: 'VIT University', skills: ['MongoDB', 'Express', 'React', 'Node.js'], domains: ['Web Development', 'Backend'], experience: 'intermediate', demographics: { gender: 'male', country: 'India', ageGroup: '18-24' } },
    { name: 'Amina Ouedraogo', email: 'amina@2ie.edu.bf', bio: 'Environmental engineer turning to tech, building apps for water quality monitoring and climate data', institution: '2iE Burkina Faso', skills: ['Python', 'Data Analysis', 'GIS', 'IoT'], domains: ['Data Science'], experience: 'beginner', demographics: { gender: 'female', country: 'Burkina Faso', ageGroup: '18-24' } },
    { name: 'Takeshi Mori', email: 'takeshi@waseda.jp', bio: 'AR/VR developer, Unity and Unreal Engine, building immersive educational experiences for students', institution: 'Waseda University', skills: ['Unity', 'C#', 'Unreal Engine', 'AR/VR'], domains: ['Web Development'], experience: 'intermediate', demographics: { gender: 'male', country: 'Japan', ageGroup: '18-24' } },
    { name: 'Nadia Benali', email: 'nadia@usthb.dz', bio: 'NLP researcher, Arabic language processing, building dialect translation models using transformers', institution: 'USTHB', skills: ['Python', 'NLP', 'HuggingFace', 'Arabic NLP'], domains: ['Machine Learning', 'Data Science'], experience: 'intermediate', demographics: { gender: 'female', country: 'Algeria', ageGroup: '18-24' } },
    { name: 'David Park', email: 'david@yonsei.ac.kr', bio: 'Backend engineer, Go and microservices, Kubernetes deployment, building high-throughput trading systems', institution: 'Yonsei University', skills: ['Go', 'Kubernetes', 'gRPC', 'PostgreSQL'], domains: ['Backend', 'DevOps'], experience: 'expert', demographics: { gender: 'male', country: 'South Korea', ageGroup: '18-24' } },
    { name: 'Sana Iqbal', email: 'sana@lums.edu.pk', bio: 'AI ethics researcher and ML engineer, bias in algorithms, fairness in hiring AI systems', institution: 'LUMS', skills: ['Python', 'Machine Learning', 'Ethics', 'Statistics'], domains: ['Machine Learning', 'Data Science'], experience: 'intermediate', demographics: { gender: 'female', country: 'Pakistan', ageGroup: '18-24' } },
    { name: 'Oluwaseun Adeyemi', email: 'seun@uniibadan.edu.ng', bio: 'Software developer building offline-first apps for low-connectivity environments in Africa', institution: 'University of Ibadan', skills: ['JavaScript', 'PWA', 'IndexedDB', 'Service Workers'], domains: ['Web Development', 'Mobile Development'], experience: 'intermediate', demographics: { gender: 'male', country: 'Nigeria', ageGroup: '18-24' } },
    { name: 'Mei Suzuki', email: 'mei@keio.ac.jp', bio: 'Robotics and AI student, ROS, SLAM algorithms, autonomous drone navigation for disaster response', institution: 'Keio University', skills: ['Python', 'ROS', 'C++', 'Computer Vision'], domains: ['Machine Learning'], experience: 'intermediate', demographics: { gender: 'female', country: 'Japan', ageGroup: '18-24' } },
    { name: 'Tarek Mansouri', email: 'tarek@esprit.tn', bio: 'DevOps engineer intern, CI/CD pipelines, Docker, monitoring with Grafana and Prometheus', institution: 'ESPRIT Tunisia', skills: ['Docker', 'Jenkins', 'Grafana', 'Linux', 'Python'], domains: ['DevOps'], experience: 'beginner', demographics: { gender: 'male', country: 'Tunisia', ageGroup: '18-24' } },
    { name: 'Grace Wanjiku', email: 'grace@strathmore.edu', bio: 'Mobile and web developer, built 3 fintech apps for M-Pesa integration, React Native specialist', institution: 'Strathmore University', skills: ['React Native', 'Node.js', 'M-Pesa API', 'Firebase'], domains: ['Mobile Development', 'Web Development'], experience: 'intermediate', demographics: { gender: 'female', country: 'Kenya', ageGroup: '18-24' } },
    { name: 'Andrei Ionescu', email: 'andrei@upb.ro', bio: 'Security researcher, reverse engineering, binary exploitation, CTF top-100 globally', institution: 'UPB Romania', skills: ['C', 'Assembly', 'Reverse Engineering', 'GDB'], domains: ['Security'], experience: 'expert', demographics: { gender: 'male', country: 'Romania', ageGroup: '18-24' } },
    { name: 'Kavya Reddy', email: 'kavya@iithyd.ac.in', bio: 'NLP and conversational AI researcher, building multilingual chatbots for Indian regional languages', institution: 'IIT Hyderabad', skills: ['Python', 'NLP', 'Transformers', 'FastAPI'], domains: ['Machine Learning'], experience: 'intermediate', demographics: { gender: 'female', country: 'India', ageGroup: '18-24' } },
    { name: 'Bright Asante', email: 'bright@ucc.edu.gh', bio: 'Data engineer, Apache Spark and data pipelines, building real-time analytics for healthcare in Ghana', institution: 'UCC Ghana', skills: ['Apache Spark', 'Python', 'Kafka', 'SQL'], domains: ['Data Science', 'Backend'], experience: 'intermediate', demographics: { gender: 'male', country: 'Ghana', ageGroup: '18-24' } },
    { name: 'Lena Fischer', email: 'lena@kit.edu', bio: 'Quantum computing enthusiast, IBM Qiskit developer, exploring quantum ML algorithms', institution: 'KIT', skills: ['Python', 'Qiskit', 'Linear Algebra', 'Machine Learning'], domains: ['Machine Learning', 'Data Science'], experience: 'intermediate', demographics: { gender: 'female', country: 'Germany', ageGroup: '18-24' } },
    { name: 'Mohammed Al-Farsi', email: 'mohammed@squ.edu.om', bio: 'Full stack developer, Vue.js and Laravel, building smart city solutions for Muscat', institution: 'Sultan Qaboos University', skills: ['Vue.js', 'Laravel', 'PHP', 'MySQL'], domains: ['Web Development', 'Backend'], experience: 'intermediate', demographics: { gender: 'male', country: 'Oman', ageGroup: '18-24' } },
    { name: 'Temi Adesanya', email: 'temi@covenant.edu.ng', bio: 'UI/UX designer with coding skills, React and Tailwind, building inclusive apps for users with disabilities', institution: 'Covenant University', skills: ['React', 'Figma', 'CSS', 'Accessibility'], domains: ['UI/UX Design', 'Web Development'], experience: 'beginner', demographics: { gender: 'female', country: 'Nigeria', ageGroup: '18-24' } },
    { name: 'Vikram Nair', email: 'vikram@nit.ac.in', bio: 'Cloud architect, AWS Solutions Architect certified, multi-cloud deployments, serverless architectures', institution: 'NIT Trichy', skills: ['AWS', 'Azure', 'Serverless', 'Python', 'Terraform'], domains: ['DevOps', 'Backend'], experience: 'expert', demographics: { gender: 'male', country: 'India', ageGroup: '18-24' } },
  ];

  const participants = await User.insertMany(
    participantData.map((p) => ({ ...p, password: hash('Part@123'), emailVerified: true, isActive: true, role: 'participant' }))
  );

  
  const hackathon = await Hackathon.create({
    name: 'HackForge 2025 — National Hackathon',
    description: 'HackForge brings together 500+ innovators to solve real-world problems using AI, blockchain, and emerging technologies.',
    theme: 'AI for Social Good',
    startDate: new Date('2025-07-10'),
    endDate: new Date('2025-07-12'),
    registrationDeadline: new Date('2025-07-05'),
    maxParticipants: 500,
    status: 'evaluation',
    evaluationCriteria: [
      { name: 'Innovation', weight: 25, description: 'Originality and creativity of the solution' },
      { name: 'Technical Complexity', weight: 25, description: 'Depth and quality of technical implementation' },
      { name: 'Impact', weight: 20, description: 'Potential real-world impact and scalability' },
      { name: 'Presentation', weight: 15, description: 'Clarity and quality of demo and pitch' },
      { name: 'Feasibility', weight: 15, description: 'Practicality and viability for deployment' },
    ],
    prizes: '1st: Rs.5,00,000 + Internship at Google India | 2nd: Rs.2,00,000 + Azure Cloud Credits | 3rd: Rs.1,00,000 + AWS Credits',
    rules: 'Teams of 2-4 members. All code must be written during the event. Use of pre-trained models is permitted with disclosure. GitHub repo and live demo required for submission.',
    faqs: [
      { question: 'Can I participate solo?', answer: 'Teams of 2-4 are required. Solo registrations are not accepted.' },
      { question: 'What is the tech stack allowed?', answer: 'Any open-source technology is allowed. Proprietary APIs must be declared.' },
      { question: 'When are results announced?', answer: 'Results will be announced within 2 hours of the evaluation deadline.' },
      { question: 'Is there a code submission format?', answer: 'GitHub repo link + live demo URL are required for submission.' },
    ],
    createdBy: admins[0]._id,
  });

  
  const projectsData = [
    { title: 'MediScan AI', teamName: 'HealthFirst', description: 'AI-powered diagnostic tool using computer vision to detect early signs of diabetic retinopathy from retinal scans with 94% accuracy. Trained on 50,000+ annotated images using EfficientNet.', techStack: ['Python', 'TensorFlow', 'React', 'FastAPI', 'MongoDB'], domain: 'Healthcare AI', teamMembers: [participants[0]._id, participants[5]._id, participants[6]._id] },
    { title: 'AgroSense', teamName: 'FarmTech', description: 'IoT and ML platform for precision agriculture — soil moisture sensors, weather ML models, and automated irrigation. Reduces water waste by 40% and increases crop yield by 25%.', techStack: ['Python', 'IoT', 'Node.js', 'React', 'InfluxDB'], domain: 'AgriTech', teamMembers: [participants[18]._id, participants[26]._id, participants[36]._id] },
    { title: 'BlockVote', teamName: 'DemocraChain', description: 'Tamper-proof blockchain voting system using Ethereum smart contracts and zero-knowledge proofs to ensure voter anonymity while maintaining full auditability.', techStack: ['Solidity', 'Ethereum', 'React', 'Web3.js', 'IPFS'], domain: 'Blockchain', teamMembers: [participants[8]._id, participants[16]._id, participants[34]._id] },
    { title: 'SafeStreet', teamName: 'CityGuard', description: 'Real-time urban safety monitoring using YOLOv8 for anomaly detection in CCTV feeds. Alerts authorities in <3 seconds with GPS coordinates and incident classification.', techStack: ['Python', 'OpenCV', 'YOLOv8', 'FastAPI', 'React'], domain: 'Public Safety AI', teamMembers: [participants[12]._id, participants[31]._id, participants[4]._id] },
    { title: 'EduPath', teamName: 'LearnForward', description: 'Personalised learning platform using NLP to analyse student responses and adapt curriculum in real time. Supports 12 Indian regional languages with 87% comprehension improvement.', techStack: ['Python', 'NLP', 'React', 'MongoDB', 'FastAPI'], domain: 'EdTech', teamMembers: [participants[35]._id, participants[27]._id, participants[7]._id] },
    { title: 'GreenLedger', teamName: 'EcoChain', description: 'Blockchain-based carbon credit trading platform with automated verification using satellite imagery analysis. Companies can trade verified carbon offsets transparently.', techStack: ['Solidity', 'Python', 'React', 'Satellite API', 'PostgreSQL'], domain: 'Climate Tech', teamMembers: [participants[39]._id, participants[25]._id, participants[9]._id] },
    { title: 'MindBridge', teamName: 'WellnessAI', description: 'Mental health companion app using sentiment analysis and CBT techniques. Detects emotional distress from text/voice with 89% accuracy and connects users to counsellors within 5 minutes.', techStack: ['React Native', 'Python', 'NLP', 'Firebase', 'Node.js'], domain: 'HealthTech', teamMembers: [participants[21]._id, participants[28]._id, participants[1]._id] },
    { title: 'TrafficFlow', teamName: 'SmartCity', description: 'AI traffic management system using RL to optimise signal timing. Reduces average commute time by 30% in simulations using real Chennai traffic data with 1M+ data points.', techStack: ['Python', 'Reinforcement Learning', 'TensorFlow', 'React', 'PostgreSQL'], domain: 'Smart Cities', teamMembers: [participants[10]._id, participants[29]._id, participants[20]._id] },
    { title: 'CreditBridge', teamName: 'FinInclusion', description: 'Alternative credit scoring for unbanked populations using ML models on mobile data, UPI patterns, and social signals. Achieved 82% accuracy in pilot with 500 users in rural Maharashtra.', techStack: ['Python', 'ML', 'React Native', 'Node.js', 'MongoDB'], domain: 'FinTech', teamMembers: [participants[33]._id, participants[11]._id, participants[24]._id] },
    { title: 'AquaMonitor', teamName: 'CleanWater', description: 'IoT network monitoring water quality in rivers and reservoirs. ML models predict contamination 72 hours in advance. Already deployed at 3 sites in Burkina Faso.', techStack: ['IoT', 'Python', 'TensorFlow', 'React', 'InfluxDB'], domain: 'Environmental Tech', teamMembers: [participants[25]._id, participants[19]._id, participants[32]._id] },
    { title: 'SecureVault', teamName: 'CyberShield', description: 'Zero-trust security framework with AI-powered threat detection. Uses LSTM models to detect anomalous network behaviour with <0.1% false positive rate, tested on CICIDS2017 dataset.', techStack: ['Python', 'Machine Learning', 'Docker', 'ELK Stack', 'React'], domain: 'Cybersecurity', teamMembers: [participants[3]._id, participants[16]._id, participants[34]._id] },
    { title: 'TranslateNow', teamName: 'LangBridge', description: 'Real-time sign language to text/speech translator using MediaPipe and CNN. Supports ISL (Indian Sign Language) with 91% accuracy. Live demo works on mobile camera.', techStack: ['Python', 'MediaPipe', 'TensorFlow', 'React Native', 'FastAPI'], domain: 'Accessibility AI', teamMembers: [participants[37]._id, participants[17]._id, participants[22]._id] },
  ];

  const projects = await Project.insertMany(
    projectsData.map((p, idx) => ({ 
      ...p, 
      hackathonId: hackathon._id, 
      status: 'evaluated', 
      submittedAt: new Date('2025-07-11T18:00:00Z'),
      videoUrl: idx % 2 === 0 ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' : 'https://www.youtube.com/watch?v=XH5OW46yFdw'
    }))
  );

  const teamsToInsert = projects.map((proj, idx) => {
    const origData = projectsData[idx];
    return {
      name: origData.teamName,
      hackathonId: hackathon._id,
      leaderId: origData.teamMembers[0],
      members: origData.teamMembers,
      projectId: proj._id,
      inviteCode: `TEAM${idx + 100}`
    };
  });
  const createdTeams = await Team.insertMany(teamsToInsert);

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    const team = createdTeams[i];
    proj.teamId = team._id;
    proj.submittedBy = team.leaderId;
    await proj.save();

    await User.updateMany(
      { _id: { $in: team.members } },
      { teamId: team._id }
    );
  }

  const assignmentPairs = [
    [0, 0], [1, 0], [0, 1], [2, 1], [2, 2], [4, 2], [1, 3], [3, 3],
    [3, 4], [7, 4], [4, 5], [5, 5], [5, 6], [6, 6], [6, 7], [7, 7],
    [0, 8], [6, 8], [2, 9], [3, 9], [5, 10], [1, 10], [7, 11], [4, 11],
  ];

  await Assignment.insertMany(
    assignmentPairs.map(([ri, pi]) => ({
      reviewerId: reviewers[ri]._id,
      projectId: projects[pi]._id,
      hackathonId: hackathon._id,
      confidence: parseFloat((0.7 + Math.random() * 0.3).toFixed(3)),
      expertiseScore: parseFloat((0.6 + Math.random() * 0.4).toFixed(3)),
      workloadScore: parseFloat((0.5 + Math.random() * 0.5).toFixed(3)),
      conflictScore: 1,
      assignedBy: 'ai',
      status: 'completed',
    }))
  );

  
  const evalData = [
    // Reviewer 0 (Dr. Arjun Nair - ML expert) — slightly generous
    { ri: 0, pi: 0, scores: { innovation: 9, technical: 9, impact: 8, presentation: 8, feasibility: 8 }, feedback: 'Exceptional ML implementation. The EfficientNet architecture choice is well-justified.' },
    { ri: 0, pi: 1, scores: { innovation: 8, technical: 7, impact: 9, presentation: 7, feasibility: 8 }, feedback: 'Strong real-world applicability. IoT integration is solid.' },
    { ri: 0, pi: 8, scores: { innovation: 8, technical: 8, impact: 9, presentation: 7, feasibility: 7 }, feedback: 'Good use of alternative data. Needs more rigorous validation.' },
    // Reviewer 1 (Emily - Web expert) — normal scorer
    { ri: 1, pi: 0, scores: { innovation: 7, technical: 8, impact: 8, presentation: 7, feasibility: 7 }, feedback: 'Solid full-stack implementation. API design is clean and scalable.' },
    { ri: 1, pi: 2, scores: { innovation: 8, technical: 9, impact: 7, presentation: 7, feasibility: 6 }, feedback: 'ZK proof implementation is impressive. UI needs improvement.' },
    { ri: 1, pi: 10, scores: { innovation: 8, technical: 7, impact: 9, presentation: 7, feasibility: 7 }, feedback: 'Good threat detection approach. Consider SOAR integration.' },
    // Reviewer 2 (Kwame - Mobile) — normal scorer
    { ri: 2, pi: 1, scores: { innovation: 7, technical: 7, impact: 8, presentation: 6, feasibility: 7 }, feedback: 'Practical AgriTech solution. Mobile interface needs refinement.' },
    { ri: 2, pi: 2, scores: { innovation: 9, technical: 8, impact: 8, presentation: 7, feasibility: 6 }, feedback: 'Blockchain voting is innovative. Scalability concerns at national level.' },
    { ri: 2, pi: 9, scores: { innovation: 7, technical: 6, impact: 9, presentation: 7, feasibility: 7 }, feedback: 'Impactful water quality solution. Live deployment is impressive.' },
    // Reviewer 3 (Mei - DevOps) — strict scorer (outlier — will trigger bias alert)
    { ri: 3, pi: 3, scores: { innovation: 4, technical: 5, impact: 5, presentation: 4, feasibility: 4 }, feedback: 'Infrastructure is not production-ready. Lacks proper orchestration.' },
    { ri: 3, pi: 4, scores: { innovation: 5, technical: 4, impact: 5, presentation: 5, feasibility: 4 }, feedback: 'Deployment strategy is weak. No containerisation or scaling plan.' },
    { ri: 3, pi: 9, scores: { innovation: 4, technical: 5, impact: 6, presentation: 4, feasibility: 5 }, feedback: 'IoT network lacks redundancy. Data pipeline is naive.' },
    // Reviewer 4 (Lucas - Blockchain) — normal scorer
    { ri: 4, pi: 2, scores: { innovation: 9, technical: 9, impact: 8, presentation: 7, feasibility: 7 }, feedback: 'ZK proofs are correctly implemented. Gas optimisation could be better.' },
    { ri: 4, pi: 5, scores: { innovation: 8, technical: 7, impact: 9, presentation: 7, feasibility: 6 }, feedback: 'Carbon credit tokenisation is novel. Oracle integration needs work.' },
    { ri: 4, pi: 11, scores: { innovation: 8, technical: 8, impact: 9, presentation: 8, feasibility: 7 }, feedback: 'Accessibility tech with great accuracy. Impressive real-time demo.' },
    // Reviewer 5 (Dr. Fatima - Security) — normal scorer
    { ri: 5, pi: 5, scores: { innovation: 7, technical: 7, impact: 8, presentation: 7, feasibility: 7 }, feedback: 'Satellite verification is creative. Smart contract audits needed.' },
    { ri: 5, pi: 6, scores: { innovation: 8, technical: 7, impact: 9, presentation: 8, feasibility: 7 }, feedback: 'Mental health AI is impactful. Privacy and data security are critical.' },
    { ri: 5, pi: 10, scores: { innovation: 9, technical: 9, impact: 8, presentation: 8, feasibility: 8 }, feedback: 'LSTM anomaly detection is state-of-art. Excellent false positive rate.' },
    // Reviewer 6 (James - Data) — normal scorer
    { ri: 6, pi: 6, scores: { innovation: 8, technical: 7, impact: 9, presentation: 8, feasibility: 8 }, feedback: 'Sentiment analysis pipeline is robust. CBT integration is clinically sound.' },
    { ri: 6, pi: 7, scores: { innovation: 8, technical: 8, impact: 9, presentation: 7, feasibility: 8 }, feedback: 'RL for traffic is well-implemented. Real data validation is a major plus.' },
    { ri: 6, pi: 8, scores: { innovation: 7, technical: 7, impact: 9, presentation: 7, feasibility: 8 }, feedback: 'Real-world pilot data is compelling. Fairness in credit scoring needs work.' },
    // Reviewer 7 (Ananya - Design) — slightly generous (mild outlier)
    { ri: 7, pi: 4, scores: { innovation: 9, technical: 8, impact: 9, presentation: 9, feasibility: 8 }, feedback: 'Multilingual support is exceptional. UX is beautifully designed and inclusive.' },
    { ri: 7, pi: 7, scores: { innovation: 8, technical: 7, impact: 8, presentation: 9, feasibility: 7 }, feedback: 'Excellent presentation and data visualisation. Dashboard is very intuitive.' },
    { ri: 7, pi: 11, scores: { innovation: 9, technical: 8, impact: 9, presentation: 9, feasibility: 8 }, feedback: 'Sign language translator is deeply impactful. Demo was flawless.' },
  ];

  const evaluations = await Evaluation.insertMany(
    evalData.map(({ ri, pi, scores, feedback }) => ({
      projectId: projects[pi]._id,
      reviewerId: reviewers[ri]._id,
      hackathonId: hackathon._id,
      scores,
      totalScore: Object.values(scores).reduce((a, b) => a + b, 0),
      feedback,
      status: 'completed',
      submittedAt: new Date('2025-07-12T14:00:00Z'),
    }))
  );

  
  await BiasAlert.insertMany([
    {
      hackathonId: hackathon._id,
      dimension: 'reviewer-outlier',
      severity: 'high',
      description: 'Reviewer Mei Lin Zhang has a Z-score of 2.7 — consistently scoring 35% below the group average across all assigned projects, suggesting overly strict evaluation standards.',
      affectedReviewerId: reviewers[3]._id,
      zScore: 2.7,
      statisticalDetail: 'Reviewer mean: 24.3, overall mean: 37.8, SD: 4.98',
      resolved: false,
    },
    {
      hackathonId: hackathon._id,
      dimension: 'technology',
      severity: 'medium',
      description: 'Projects using Python + ML stack score 18% higher on average than projects using primarily JavaScript/Node.js. Possible tech stack preference bias among reviewers.',
      statisticalDetail: 'Python/ML mean: 41.2, JS/Node mean: 34.9, overall SD: 3.21',
      resolved: false,
    },
    {
      hackathonId: hackathon._id,
      dimension: 'gender',
      severity: 'low',
      description: 'Minor scoring difference detected between projects led by different gender demographics. Difference is within acceptable range but flagged for monitoring.',
      statisticalDetail: 'Male-led teams mean: 38.4, Female-led teams mean: 36.1, p=0.12 (not significant)',
      resolved: true,
      resolvedBy: admins[0]._id,
      resolvedAt: new Date(),
    },
  ]);

  
  await Announcement.insertMany([
    { title: 'Hackathon Has Officially Begun!', body: 'Welcome to HackForge 2025! All teams have been registered and projects should be submitted by 6 PM on July 11th. Check the schedule tab for session timings. Best of luck to all 500+ participants!', targetRole: 'all', hackathonId: hackathon._id, createdBy: admins[0]._id, pinned: true, type: 'success' },
    { title: 'Submission Deadline Reminder', body: 'This is your final reminder — project submissions close in 2 hours (6:00 PM IST). Ensure your GitHub repo is public and your demo link is accessible. Late submissions will not be accepted.', targetRole: 'participant', hackathonId: hackathon._id, createdBy: admins[0]._id, pinned: true, type: 'warning' },
    { title: 'Evaluation Round Started', body: 'All 8 reviewers have received their project assignments via the platform. Evaluations must be completed by 2 PM on July 12th. Please review the evaluation rubric in your dashboard.', targetRole: 'reviewer', hackathonId: hackathon._id, createdBy: admins[1]._id, pinned: false, type: 'info' },
    { title: 'Results Will Be Announced at 5 PM Today', body: 'Results processing is underway. Winners will be announced at 5 PM IST in the main auditorium and simultaneously on this platform. All participants are invited to attend the closing ceremony.', targetRole: 'all', hackathonId: hackathon._id, createdBy: admins[0]._id, pinned: true, type: 'urgent' },
  ]);

  
  await ChatMessage.insertMany([
    { sender: admins[0]._id, senderName: 'Priya Sharma', senderRole: 'admin', body: 'Welcome to the HackForge 2025 general chat! Use this space for questions and team coordination.', room: 'general', hackathonId: hackathon._id },
    { sender: participants[0]._id, senderName: 'Aarav Patel', senderRole: 'participant', body: 'Hi everyone! Team MediScan here — excited to be participating. Who else is working on healthcare AI?', room: 'general', hackathonId: hackathon._id },
    { sender: participants[5]._id, senderName: 'Sofia Nguyen', senderRole: 'participant', body: 'Hey! We are also doing health-related ML. Let\'s connect after the event!', room: 'general', hackathonId: hackathon._id },
    { sender: participants[8]._id, senderName: 'Ali Hassan', senderRole: 'participant', body: 'Quick question — are we allowed to use OpenZeppelin contracts for our smart contract implementation?', room: 'general', hackathonId: hackathon._id },
    { sender: admins[0]._id, senderName: 'HackForge Assistant', senderRole: 'admin', body: 'Yes, open-source libraries including OpenZeppelin are fully permitted. Please declare any external libraries in your README.', room: 'general', hackathonId: hackathon._id, botGenerated: true },
    { sender: participants[12]._id, senderName: 'Ryan Kim', senderRole: 'participant', body: 'Our CCTV system demo is live! Running YOLOv8 inference at 30 FPS on laptop GPU. Really happy with the results.', room: 'general', hackathonId: hackathon._id },
    { sender: participants[24]._id, senderName: 'Raj Vardhan', senderRole: 'participant', body: 'Is there a backup power supply at the venue? Our IoT sensors need continuous power for the demo.', room: 'general', hackathonId: hackathon._id },
    { sender: admins[1]._id, senderName: 'Rahul Mehta', senderRole: 'admin', body: 'Yes, all demo tables have 4 power sockets each. Extension cords are available at the logistics desk.', room: 'general', hackathonId: hackathon._id },
    { sender: participants[35]._id, senderName: 'Kavya Reddy', senderRole: 'participant', body: 'Our multilingual NLP model supports 12 Indian languages now! Just added Odia and Assamese support this morning.', room: 'general', hackathonId: hackathon._id },
    { sender: participants[22]._id, senderName: 'Emeka Nwosu', senderRole: 'participant', body: 'Congratulations to all teams! Whatever happens today, building this in 48 hours has been an incredible experience.', room: 'general', hackathonId: hackathon._id },
  ]);

  
  await RegistrationLog.insertMany(
    participants.slice(0, 20).map((p, i) => ({
      userId: p._id,
      email: p.email,
      duplicateScore: i === 3 ? 0.72 : parseFloat((Math.random() * 0.3).toFixed(3)),
      skillsExtracted: p.skills || [],
      domainsExtracted: p.domains || [],
      experienceClassified: p.experience,
      processingMs: Math.floor(300 + Math.random() * 800),
      aiProcessed: true,
      flagged: i === 3,
      flagReason: i === 3 ? 'Duplicate score 0.72 — similar name and institution to existing user' : '',
    }))
  );

  // Update projects with final scores and ranks based on evaluation averages
  const projectRankings = [
    { title: 'EduPath', rank: 1, finalScore: 92.4, feedback: 'Outstanding multilingual NLP implementation addressing a critical education gap. The 12-language support and 87% comprehension improvement demonstrate exceptional technical depth and real-world impact. Consider expanding to Southeast Asian languages for future iterations.' },
    { title: 'MediScan AI', rank: 2, finalScore: 88.7, feedback: 'Impressive clinical AI solution with strong accuracy metrics. The EfficientNet architecture is well-suited for retinal imaging. Deploying in resource-constrained environments and obtaining clinical validation would significantly strengthen the impact case.' },
    { title: 'BlockVote', rank: 3, finalScore: 86.2, feedback: 'ZK proof implementation for anonymous voting is technically sophisticated and demonstrates deep blockchain expertise. Addressing gas costs and scalability for national-scale elections would make this production-ready.' },
    { title: 'MindBridge', rank: 4, finalScore: 84.3, feedback: 'Highly impactful mental health solution with clinically sound CBT integration. The 89% distress detection accuracy is commendable. Prioritising user privacy compliance and clinical partnerships should be the next steps.' },
    { title: 'SafeStreet', rank: 5, finalScore: 82.1, feedback: 'Real-time anomaly detection under 3 seconds is an impressive technical achievement. The solution addresses genuine public safety needs. Consider privacy implications and regulatory compliance for CCTV-based systems.' },
    { title: 'TranslateNow', rank: 6, finalScore: 80.9, feedback: 'Sign language translation with 91% ISL accuracy is groundbreaking for accessibility. The real-time mobile camera demo was highly impressive. Expanding to more regional sign languages would broaden impact significantly.' },
    { title: 'TrafficFlow', rank: 7, finalScore: 79.5, feedback: 'Reinforcement learning for traffic optimisation shows strong potential. The 30% commute reduction in simulation is compelling. Real-world deployment requires collaboration with municipal authorities and more diverse training data.' },
    { title: 'SecureVault', rank: 8, finalScore: 77.8, feedback: 'LSTM-based anomaly detection with a sub-0.1% false positive rate is state-of-the-art. Strong technical foundation. The solution would benefit from integration with existing SIEM systems for enterprise adoption.' },
    { title: 'CreditBridge', rank: 9, finalScore: 75.4, feedback: 'Meaningful fintech solution addressing financial inclusion. The 82% accuracy pilot is promising. Rigorous fairness testing to prevent algorithmic discrimination in credit scoring is essential before scaling.' },
    { title: 'GreenLedger', rank: 10, finalScore: 73.2, feedback: 'Innovative approach to carbon credit transparency. Satellite imagery verification is creative. Strengthening the smart contract security and establishing regulatory alignment would accelerate real-world adoption.' },
    { title: 'AgroSense', rank: 11, finalScore: 70.8, feedback: 'Practical and impactful precision agriculture solution. The 40% water reduction claim needs more rigorous validation. Simplifying the farmer-facing interface for low-digital-literacy users would significantly improve adoptability.' },
    { title: 'AquaMonitor', rank: 12, finalScore: 68.5, feedback: 'Real deployment in Burkina Faso is remarkable for a hackathon project. The 72-hour contamination prediction demonstrates genuine value. Focus on reducing hardware costs for broader deployment across more water sources.' },
  ];

  for (const ranking of projectRankings) {
    await Project.findOneAndUpdate(
      { title: ranking.title },
      { finalScore: ranking.finalScore, rank: ranking.rank, feedback: ranking.feedback }
    );
  }

  // Seed Cheat Shield Logs
  const cheatLogs = [];
  const videoSentiments = [];
  const juryDebates = [];

  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];

    // Seed Cheat Shield Logs
    let plag = 5 + (i * 7) % 65; // 5 to 70
    let match = 10 + (i * 9) % 75; // 10 to 85
    let level = 'low';
    if (plag > 50 || match > 60) level = 'high';
    else if (plag > 25 || match > 35) level = 'medium';

    cheatLogs.push({
      projectId: proj._id,
      hackathonId: hackathon._id,
      plagiarismScore: plag,
      boilerplateMatchScore: match,
      matchDetails: plag > 45 
        ? `High code block similarity (over 45%) matched with GitHub repository 'react-starter-kit-2024'. Review recommended.`
        : `Starter templates and boilerplate code matching standard configurations. Standard compliance level.`,
      flagged: level === 'high',
      riskLevel: level
    });

    // Seed Video Sentiment Analysis
    if (proj.videoUrl) {
      videoSentiments.push({
        projectId: proj._id,
        videoUrl: proj.videoUrl,
        deliveryScore: 6 + (i * 2) % 5, // 6 to 10
        confidenceScore: 5 + (i * 3) % 6, // 5 to 10
        pacing: (i % 3 === 0) ? 'slow' : (i % 3 === 1 ? 'balanced' : 'fast'),
        valuePropSummary: `Excellent articulation of the core problem solving '${proj.domain}'. The pitch clearly details the implementation of ${proj.techStack.join(', ')} and targets direct real-world users.`,
        presentationTips: [
          'Maintain better eye contact with the camera rather than looking down at slides.',
          'Slow down slightly during the technical architectural walkthrough.',
          'Clearly specify the competitive advantages and target market viability.'
        ]
      });
    }

    // Seed AI Jury Debate transcripts for unstable projects (e.g. MediScan AI and BlockVote)
    if (proj.title === 'MediScan AI' || proj.title === 'BlockVote' || proj.title === 'EduPath') {
      juryDebates.push({
        projectId: proj._id,
        hackathonId: hackathon._id,
        transcript: [
          {
            judge: "Dev Dynamo",
            role: "Technical Architect",
            message: `Analyzing the stack chosen for "${proj.title}", the integrations look functionally complete. However, they've implemented a straightforward architecture without substantial backend caching. I'd rate their engineering depth a solid B+.`
          },
          {
            judge: "Pixel Perfect",
            role: "UX/UI Lead",
            message: "I actually appreciate their attention to accessibility. The typography hierarchy is clean, and the dashboard layout is very intuitive. They could improve the micro-interactions, but from a usability perspective, it's highly polished."
          },
          {
            judge: "Venture Vision",
            role: "Business Calibrator",
            message: `From a market standpoint, the value proposition is clear. The feasibility of launching this prototype is high because of low initial infrastructure costs. I agree with Dev Dynamo's note on scaling, but the prototype is highly viable.`
          }
        ],
        consensusScore: 38 + (i % 8), // 38 to 45
        verdictSummary: `The jury agrees that "${proj.title}" represents a well-designed, viable solution with solid UX decisions, though it requires further backend optimizations to scale efficiently.`
      });
    }
  }

  await CheatShieldLog.insertMany(cheatLogs);
  await AiVideoSentiment.insertMany(videoSentiments);
  await AiJuryDebate.insertMany(juryDebates);

  console.log('\nSeed complete!');
  console.log('Admin credentials (password: Admin@123):');
  console.log('  admin@hackforge.dev');
  console.log('  rahul@hackforge.dev');
  console.log('  sarah@hackforge.dev');
  console.log('Reviewer credentials (password: Review@123):');
  console.log('  arjun.reviewer@hackgpt.dev');
  console.log('  emily.reviewer@hackgpt.dev');
  console.log('Participant credentials (password: Part@123):');
  console.log('  aarav@student.iitd.ac.in');
  console.log('  zara@bits.ac.in');

  if (!skipConnect) {
    await mongoose.disconnect();
    process.exit(0);
  }
}

module.exports = seed;

if (require.main === module) {
  seed().catch((err) => { console.error(err); process.exit(1); });
}
