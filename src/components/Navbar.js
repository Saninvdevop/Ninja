import React, { useState } from 'react';
import { Menu, Icon, Button } from 'semantic-ui-react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import './Navbar.css'; // Import the CSS for navbar styling
import logo from '../assets/images/logo.png'; // Adjusted path to logo.png

const Navbar = ({ userRole, setUserRole }) => {
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
      {/* Logo at the top of the sidebar */}
      <div className="logo-container">
        <img src={logo} alt="Platform X Logo" className="navbar-logo" />
      </div>

      <div className="menu-items">
        {/* Menu Items */}
        <Menu vertical pointing secondary className="navbar-menu">
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
                to="/reports"
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
                name="projects"
                active={activeItem === '/projects'}
                as={Link}
                to="/projects"
                className="item"
              >
                Project Allocation
              </Menu.Item>
              <Menu.Item
                name="employees"
                active={activeItem === '/employees'}
                as={Link}
                to="/employees"
                className="item"
              >
                Employees
              </Menu.Item>
            </>
          )}
        </Menu>
      </div>

      {/* User Info Section */}
      <div
        className={`user-info ${showLogout ? 'expanded' : ''}`} // Add expanded class when toggling
        onClick={() => setShowLogout((prev) => !prev)}
      >
        <h3 className="user-name">
          <Icon name="user" className="user-icon" /> Ravi Kumar
        </h3>
        <span className={`role-tag ${userRole}`}>{userRole === 'bizops' ? 'BizOps' : 'Leader'}</span>
        
        {/* Conditionally Render Logout Button */}
        <div className="logout-container">
          {showLogout && (
            <Button
              icon
              labelPosition="left"
              color="red"
              onClick={handleLogout} // Logout handler
              className="logout-button"
            >
              <Icon name="sign-out" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
