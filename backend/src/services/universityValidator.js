const { callGemini } = require('./gemini');

const UNIVERSITIES = [
  'Techno India University', 'Techno India', 'Meghnad Saha Institute of Technology', 'Meghnad Saha',
  'Heritage Institute of Technology', 'Institute of Engineering and Management', 'IEM',
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Hyderabad',
  'IIT Guwahati', 'IIT BHU', 'IIT Indore', 'IIT Patna', 'IIT Jodhpur', 'IIT Bhubaneswar', 'IIT Gandhinagar',
  'IIT Ropar', 'IIT Mandi', 'IIT Tirupati', 'IIT Palakkad', 'IIT Dharwad', 'IIT Jammu', 'IIT Bhilai',
  'BITS Pilani', 'BITS Goa', 'BITS Hyderabad', 'IISc Bangalore', 'IIIT Hyderabad', 'IIIT Delhi',
  'IIIT Bangalore', 'IIIT Allahabad', 'IIIT Gwalior', 'IIIT Jabalpur', 'IIIT Kancheepuram', 'IIIT Pune',
  'IIIT Lucknow', 'IIIT Vadodara', 'IIIT Sri City', 'IIIT Guwahati', 'IIIT Kota', 'IIIT Kalyani',
  'NIT Trichy', 'NIT Warangal', 'NIT Surathkal', 'NIT Calicut', 'NIT Rourkela', 'NIT Kurukshetra',
  'NIT Jalandhar', 'NIT Durgapur', 'NIT Silchar', 'NIT Srinagar', 'NIT Surat', 'NIT Patna',
  'NIT Raipur', 'NIT Jamshedpur', 'NIT Hamirpur', 'NIT Goa', 'NIT Delhi', 'NIT Uttarakhand',
  'NIT Mizoram', 'NIT Nagaland', 'NIT Manipur', 'NIT Arunachal Pradesh', 'NIT Meghalaya',
  'NIT Agartala', 'NIT Sikkim', 'NIT Andhra Pradesh', 'MNNIT Allahabad', 'MANIT Bhopal', 'MNIT Jaipur',
  'VNIT Nagpur', 'SVNIT Surat', 'IIEST Shibpur', 'BIT Mesra', 'BIT Sindri', 'COEP Pune', 'VJTI Mumbai',
  'SPIT Mumbai', 'DJ Sanghvi Mumbai', 'PICT Pune', 'VIT Pune', 'MIT WPU Pune', 'Cummins College Pune',
  'WCE Sangli', 'SGGS Nanded', 'LD College of Engineering Ahmedabad', 'Nirma University Ahmedabad',
  'DA-IICT', 'DAIICT', 'PDEU Gandhinagar', 'PDPU Gandhinagar', 'Dharmsinh Desai University Nadiad',
  'MSU Baroda', 'SGSITS Indore', 'IET DAVV Indore', 'MITS Gwalior', 'JEC Jabalpur', 'UIT RGPV Bhopal',
  'LNCT Bhopal', 'DTU Delhi', 'NSUT Delhi', 'PEC Chandigarh', 'RVCE Bangalore', 'BMSCE Bangalore',
  'PES University Bangalore', 'MS Ramaiah Institute of Technology', 'VIT University', 'SRM University',
  'Manipal Institute of Technology', 'Anna University', 'Jadavpur University', 'Amrita Vishwa Vidyapeetham',
  'PSG College of Technology', 'Thapar Institute of Engineering and Technology', 'KIIT University',
  'Vellore Institute of Technology', 'Sathyabama University', 'Kalinga Institute of Industrial Technology',
  'Galgotias University', 'Sharda University', 'Bennett University', 'Shiv Nadar University',
  'UPES Dehradun', 'Graphic Era University', 'Lovely Professional University', 'Chandigarh University',
  'Amity University', 'Symbiosis International University', 'University of Delhi', 'Savitribai Phule Pune University',
  'JNTU Hyderabad', 'JNTU Kakinada', 'Osmania University', 'H H M S B Kotak', 'L.J. Institute of Engineering',
  'Nirma University', 'Sardar Patel University', 'Gujarat Technological University', 'LDRP Gandhinagar',
  'MIT', 'Stanford University', 'Harvard University', 'Caltech', 'UC Berkeley', 'Carnegie Mellon University',
  'Princeton University', 'Yale University', 'Columbia University', 'Cornell University', 'University of Michigan',
  'University of Texas at Austin', 'University of Washington', 'Georgia Tech', 'University of Illinois Urbana-Champaign',
  'Purdue University', 'Ohio State University', 'Penn State', 'UCLA', 'UC San Diego', 'USC', 'NYU',
  'Boston University', 'Northeastern University', 'University of Toronto', 'University of British Columbia',
  'McGill University', 'University of Waterloo', 'Oxford University', 'Cambridge University', 'Imperial College London',
  'UCL', 'University of Edinburgh', 'King\'s College London', 'University of Manchester', 'ETH Zurich',
  'TU Munich', 'RWTH Aachen', 'KIT', 'University of Amsterdam', 'Delft University of Technology',
  'Paris Saclay University', 'Sorbonne University', 'Ecole Polytechnique', 'EPFL', 'KU Leuven',
  'Aarhus University', 'University of Copenhagen', 'Uppsala University', 'KTH Royal Institute of Technology',
  'Chalmers University', 'University of Helsinki', 'Aalto University', 'TU Berlin', 'LMU Munich',
  'University of Tokyo', 'Tokyo Institute of Technology', 'Osaka University', 'Kyoto University',
  'Tohoku University', 'Keio University', 'Waseda University', 'KAIST', 'Seoul National University',
  'POSTECH', 'Yonsei University', 'Peking University', 'Tsinghua University', 'Fudan University',
  'National University of Singapore', 'Nanyang Technological University', 'HKUST', 'University of Hong Kong',
  'Chinese University of Hong Kong', 'HCMC University of Technology', 'University of Lagos',
  'University of Cape Town', 'University of Nairobi', 'University of Ghana', 'KNUST', 'Strathmore University',
  'Obafemi Awolowo University', 'Ahmadu Bello University', 'University of Ibadan',
  'Federal University of Technology Akure', 'University of Pretoria', 'Stellenbosch University',
  'American University in Cairo', 'Alexandria University', 'Cairo University', 'University of Khartoum',
  'University of Addis Ababa', 'UNAM', 'Universidad de Chile', 'Pontificia Universidad Catolica de Chile',
  'Universidad de Buenos Aires', 'University of Sao Paulo', 'UNICAMP', 'PUC-Rio', 'Universidad Nacional de Colombia',
  'Universidad de los Andes', 'ESPRIT Tunisia', 'USTHB', '2iE Burkina Faso', 'Cheikh Anta Diop University',
  'ESP Dakar', 'Moscow State University', 'St. Petersburg Polytechnic', 'MIPT', 'Moscow Institute of Physics and Technology',
  'Bauman Moscow State Technical University', 'Sultan Qaboos University', 'King Abdulaziz University',
  'King Fahd University of Petroleum and Minerals', 'American University of Beirut', 'University of Jordan',
  'Qatar University', 'Kuwait University', 'University of Tehran', 'Sharif University of Technology',
  'NUST Pakistan', 'LUMS', 'University of Karachi', 'IBA Karachi', 'University of Engineering and Technology Lahore',
  'Politehnica Bucharest', 'UPB Romania', 'TU Wien', 'Graz University of Technology', 'Warsaw University of Technology',
  'AGH University', 'Prague Technical University', 'CTU Prague', 'Budapest University of Technology',
  'University of Belgrade', 'University of Zagreb'
];

const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();

const isGarbageInput = (str) => {
  const word = str.toLowerCase().trim();
  if (word.length < 3) return false;
  if (/(.)\1\1/.test(word)) return true;
  if (/[bcdfghjklmnpqrstvwxyz]{4,}/i.test(word)) return true;
  if (!/[aeiouy]/i.test(word)) return true;
  const keyboardRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  for (const row of keyboardRows) {
    for (let i = 0; i <= row.length - 4; i++) {
      const pattern = row.substring(i, i + 4);
      const revPattern = pattern.split('').reverse().join('');
      if (word.includes(pattern) || word.includes(revPattern)) return true;
    }
  }
  if (word.length >= 5) {
    const vowelCount = (word.match(/[aeiouy]/g) || []).length;
    if (vowelCount / word.length < 0.18) return true;
  }
  return false;
};

const validateUniversity = async (input) => {
  if (!input || input.trim().length < 3) return { valid: false, suggestions: [] };

  const norm = normalize(input);

  const exact = UNIVERSITIES.find((u) => normalize(u) === norm);
  if (exact) return { valid: true, matched: exact, suggestions: [] };

  const words = norm.split(/\s+/);
  const containsGarbage = words.some(w => isGarbageInput(w));
  if (containsGarbage) {
    return { valid: false, suggestions: [] };
  }

  const suggestions = UNIVERSITIES.filter((u) => {
    const un = normalize(u);
    return un.includes(norm) || norm.includes(un.substring(0, Math.min(un.length, norm.length)));
  }).slice(0, 6);

  // Fallback to Gemini AI check
  try {
    const prompt = `Analyze the following university/institution name input by a user: "${input}".
Determine if this represents a real, existing higher education institution (university, college, institute of technology, etc.) anywhere in the world.
If it is a real institution, return its official, standard English name (or standard local name).
If it is a random/garbage string, an obvious fake, a placeholder, or not a real higher education institution, mark it as invalid.

Respond ONLY in the following JSON format:
{"valid": <true or false>, "matched": "<standard official name if valid, otherwise empty string>"}
Do not include any extra text or markdown code blocks outside of the JSON.`;

    const responseText = await callGemini(prompt);
    if (responseText) {
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const result = JSON.parse(cleanJson);
      if (result && result.valid && result.matched) {
        return { valid: true, matched: result.matched, suggestions: [] };
      }
    }
  } catch (err) {
    console.error('University AI validation error:', err);
  }
  // Heuristic safety fallback if Gemini fails or is rate-limited
  const keywords = [
    'university', 'college', 'institute', 'school', 'academy', 'polytechnic',
    'iit', 'nit', 'iiit', 'bits', 'mit', 'iim', 'iisc', 'coep', 'vjti', 'iem', 'uem', 'tiet',
    'technology', 'engineering', 'science', 'arts', 'medical', 'dental', 'law',
    'campus', 'institution', 'high', 'secondary', 'techno', 'saha', 'heritage'
  ];
  const isLikelyEducational = keywords.some(kw => {
    if (kw.length <= 4) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(norm);
    }
    return norm.includes(kw);
  });

  const hasVowels = /[aeiouy]/i.test(norm);
  const notTooShort = norm.trim().length >= 4;

  if (isLikelyEducational && hasVowels && notTooShort) {
    const formattedName = input.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return { valid: true, matched: formattedName, suggestions: [] };
  }

  return { valid: false, suggestions: suggestions.length ? suggestions : [] };
};

const getAllUniversities = () => UNIVERSITIES;

module.exports = { validateUniversity, getAllUniversities };
