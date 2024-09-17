import React from 'react';
import './Viewcard.css'; // Import the CSS file for styles

const Viewcards = ({ icon, header, value, onClick }) => {
  return (
    <div className="interactive-card" onClick={onClick}>
      <div className="card-content">
        <i className={`fas ${icon} card-icon`}></i> 
        <h3 className="card-heading" style={{ textAlign: 'left' }}>{header}</h3>
        <p className="card-value" style={{ textAlign: 'left' }}>{value}</p>
      </div>
    </div>
  );
};

export default Viewcards;
