import React from 'react';
export default function KanbanBoard() {
  return (
    <div className="card">
      <h3>Team Kanban Board</h3>
      <div style={{ display: 'flex', gap: 10 }}>
        <div><h4>To Do</h4><div>Setup dev environment</div></div>
        <div><h4>In Progress</h4><div>Develop auth UI</div></div>
        <div><h4>Done</h4><div>Design schemas</div></div>
      </div>
    </div>
  );
}