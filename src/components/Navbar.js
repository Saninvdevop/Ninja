import React from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Import the CSS for navbar styling
import logo from '../assets/images/logo.png'; // Adjusted path to logo.png

const Navbar = ({ userRole }) => {
  const location = useLocation();
  const activeItem = location.pathname;

  return (
    <div className="sidebar">
      {/* Add the logo at the top of the sidebar */}
      <div className="logo-container">
        <img src={logo} alt="Platform X Logo" className="navbar-logo" />
      </div>

      {/* User Info Section */}
      <div className="user-info">
        <h3 className="user-name">
          <Icon name="user" className="user-icon" /> 
          Ravi Kumar
        </h3>
        <span className={`role-tag ${userRole}`}>{userRole === 'bizops' ? 'BizOps' : 'Leader'}</span>
      </div>

      <Menu vertical pointing secondary className="navbar-menu">
        {/* Conditional rendering based on user role */}
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
              name="projects"
              active={activeItem === '/projects'}
              as={Link}
              to="/projects"
              className="item"
            >
              Project Allocation
            </Menu.Item>
          </>
        )}
      </Menu>
    </div>
  );
};

export default Navbar;
