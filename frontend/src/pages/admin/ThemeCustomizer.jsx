import React from 'react';
export default function ThemeCustomizer() {
  return (
    <div className="card">
      <h3>Theme CSS variables customizer</h3>
      <input type="color" defaultValue="#6366f1" />
    </div>
  );
}