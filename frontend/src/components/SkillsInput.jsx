import React, { useRef } from 'react';
import { X } from 'lucide-react';

const SKILL_TAXONOMY = {
  'Web Development': ['React', 'Next.js', 'Vue.js', 'Angular', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Node.js', 'Express', 'GraphQL', 'REST API'],
  'Machine Learning': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'Deep Learning', 'Data Science', 'Pandas', 'NumPy', 'HuggingFace', 'Transformers'],
  'Mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Android', 'iOS', 'Dart', 'Firebase'],
  'Backend & Systems': ['Go', 'Java', 'C++', 'C#', 'Spring Boot', 'FastAPI', 'Django', 'PostgreSQL', 'MongoDB', 'Redis', 'Kafka', 'gRPC'],
  'Cloud & DevOps': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Microservices'],
  'Blockchain': ['Solidity', 'Ethereum', 'Web3.js', 'Smart Contracts', 'IPFS', 'Rust', 'Polkadot'],
  'Security': ['Cybersecurity', 'Penetration Testing', 'Cryptography', 'Network Security', 'SIEM', 'OSINT'],
  'Design & UX': ['Figma', 'UI/UX', 'User Research', 'Prototyping', 'Design Systems', 'Accessibility'],
};

export default function SkillsInput({ value = [], onChange, max = 12 }) {
  const inputRef = useRef(null);
  const [inputVal, setInputVal] = React.useState('');
  const [showTaxonomy, setShowTaxonomy] = React.useState(false);

  const addSkill = (skill) => {
    const s = skill.trim();
    if (!s || value.includes(s) || value.length >= max) return;
    onChange([...value, s]);
    setInputVal('');
  };

  const removeSkill = (skill) => onChange(value.filter((s) => s !== skill));

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(inputVal);
    }
    if (e.key === 'Backspace' && !inputVal && value.length) {
      removeSkill(value[value.length - 1]);
    }
  };

  return (
    <div>
      <div
        className="chips-container"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((skill) => (
          <span key={skill} className="chip">
            {skill}
            <button className="chip-remove" onClick={(e) => { e.stopPropagation(); removeSkill(skill); }}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          className="chip-input"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setShowTaxonomy(true)}
          placeholder={value.length === 0 ? 'Type a skill and press Enter, or pick below' : ''}
        />
      </div>
      <p className="form-hint">{value.length}/{max} skills selected</p>

      {showTaxonomy && (
        <div style={{ marginTop: 12, padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          {Object.entries(SKILL_TAXONOMY).map(([cat, skills]) => (
            <div key={cat}>
              <div className="skill-category-label">{cat}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {skills.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`skill-pill ${value.includes(s) ? 'selected' : ''}`}
                    onClick={() => value.includes(s) ? removeSkill(s) : addSkill(s)}
                  >
                    {value.includes(s) && <X size={10} style={{ marginRight: 2 }} />}
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button type="button" style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowTaxonomy(false)}>
            Collapse
          </button>
        </div>
      )}
    </div>
  );
}
