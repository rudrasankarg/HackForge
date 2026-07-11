import React from 'react';
export default function MonacoPreviewer() {
  return (
    <div className="card">
      <h3>Monaco Code Frame Editor Preview</h3>
      <pre>{"const express = require('express');\nconst app = express();"}</pre>
    </div>
  );
}