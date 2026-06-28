import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export default function UniversityInput({ value, onChange, error, onValidate }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [valid, setValid] = useState(false);
  const [allUniversities, setAllUniversities] = useState([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    api.get('/auth/universities').then((data) => setAllUniversities(data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); setValid(false); onValidate?.(false); return; }
    const norm = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
    const q = norm(query);
    const matches = allUniversities.filter((u) => norm(u).includes(q)).slice(0, 8);
    setSuggestions(matches);
    
    const exactMatch = allUniversities.find((u) => norm(u) === q);
    if (exactMatch) {
      setValid(true);
      onChange(exactMatch);
      onValidate?.(true);
      return;
    }

    const timer = setTimeout(() => {
      api.post('/auth/validate-university', { university: query })
        .then((res) => {
          if (res.valid) {
            setValid(true);
            onChange(res.matched);
            onValidate?.(true);
          } else {
            setValid(false);
            onValidate?.(false);
          }
        })
        .catch(() => {
          setValid(false);
          onValidate?.(false);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [query, allUniversities]);

  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (u) => {
    setQuery(u);
    onChange(u);
    setValid(true);
    onValidate?.(true);
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="autocomplete-wrap" ref={wrapRef}>
      <input
        className={`form-input ${error ? 'error' : valid ? 'success' : ''}`}
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. IIT Delhi, MIT, University of Lagos"
      />
      {!valid && query.length > 2 && (
        <p className="form-hint" style={{ color: suggestions.length ? 'var(--warning)' : 'var(--text-muted)' }}>
          {suggestions.length ? 'Select from suggestions or keep typing' : 'Not found in our list — ensure correct spelling'}
        </p>
      )}
      {valid && <p className="form-hint" style={{ color: 'var(--success)' }}>University verified</p>}
      {open && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((u) => (
            <div key={u} className="autocomplete-item" onClick={() => pick(u)}>{u}</div>
          ))}
        </div>
      )}
    </div>
  );
}
