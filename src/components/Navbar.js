import React, { useState } from 'react';
import { Menu, Icon, Button } from 'semantic-ui-react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './Navbar.css'; // Import the CSS for navbar styling
import logo from '../assets/images/logo.png'; // Adjusted path to logo.png
import { CiLogout } from "react-icons/ci";

const Navbar = ({ userRole, setUserRole }) => {  // Accept setUserRole as a prop
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate for navigation
  const activeItem = location.pathname;
  const [showLogout, setShowLogout] = useState(false); // State to toggle logout button visibility

  // Function to handle logout
  const handleLogout = () => {
    setUserRole(null); // Reset user role state
    navigate('/'); // Redirect to the login page
  };

  return (
    <div className="sidebar">
      {/* Logo at the top */}
      <div className="logo-container">
        <img src={logo} alt="Platform X Logo" className="navbar-logo" />
      </div>

      {/* Menu items in the middle */}
      <Menu vertical pointing secondary className="navbar-menu" style={{width: "auto"}}>
        {userRole === 'leader' && (
          <>
            <Menu.Item
              name="dashboard"
              active={activeItem === '/dashboard'}
              as={Link}
              to="/dashboard"
              className="item"
            >
              Dashboard
            </Menu.Item>
            <Menu.Item
              name="projects"
              active={activeItem === '/projects'}
              as={Link}
              to="/projects"
              className="item"
            >
              Projects
            </Menu.Item>
            <Menu.Item
              name="reports"
              active={activeItem === '/reports'}
              as={Link}
              to="/reports" // Add link to the new Reports page
              className="item"
            >
              Reports
            </Menu.Item>
          </>
        )}

        {userRole === 'bizops' && (
          <>
            <Menu.Item
              name="dashboardbizops"
              active={activeItem === '/dashboardbizops'}
              as={Link}
              to="/dashboardbizops"
              className="item"
            >
              Overview
            </Menu.Item>
            <Menu.Item
              name="employees"
              active={activeItem === '/employees'}
              as={Link}
              to="/employees" // Link to EmpPage.js route
              className="item"
            >
              Employees
            </Menu.Item>
            <Menu.Item
              name="projects"
              active={activeItem === '/projects'}
              as={Link}
              to="/projects"
              className="item"
            >
              Project Allocation
            </Menu.Item>
            {/* New Menu Item for Employees */}
            
          </>
        )}
      </Menu>

      {/* User Info Section - Positioned at the bottom */}
      <div className={`user-info ${showLogout ? 'expanded' : ''}`} onClick={() => setShowLogout(!showLogout)}>
        <div className="profile-details">
          <div className="profile-photo">
            <Icon name="user" className="user-icon" />
          </div>
          <div className="user-text">
            <h3 className="user-name">Ravi Kumar</h3>
            <span className={`role-tag ${userRole}`}>
              {userRole === 'bizops' ? 'BizOps' : 'Leader'}
            </span>
          </div>
        </div>

        {showLogout && (
          <div className="logout-container">
            <hr/>
            <Button
              variant="contained"
              className="logout-button"
              onClick={handleLogout}
            >
              <CiLogout /> Logout
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};

export default Navbar;
