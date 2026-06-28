import React, { useRef, useState } from 'react';

export default function OtpInput({ length = 6, onComplete }) {
  const [values, setValues] = useState(Array(length).fill(''));
  const inputs = useRef([]);

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = [...values];
    next[i] = char;
    setValues(next);
    if (char && i < length - 1) inputs.current[i + 1]?.focus();
    if (next.every((v) => v !== '')) onComplete(next.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    const next = [...values];
    text.split('').forEach((c, i) => { next[i] = c; });
    setValues(next);
    inputs.current[Math.min(text.length, length - 1)]?.focus();
    if (next.every((v) => v !== '')) onComplete(next.join(''));
  };

  return (
    <div className="otp-group" onPaste={handlePaste}>
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          className={`otp-box ${v ? 'filled' : ''}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}
