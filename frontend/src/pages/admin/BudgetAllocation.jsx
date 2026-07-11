import React from 'react';
export default function BudgetAllocation() {
  return (
    <div className="card">
      <h3>Prize & Budget Allocation Matrix</h3>
      <input type="range" min="1000" max="50000" defaultValue="10000" />
    </div>
  );
}