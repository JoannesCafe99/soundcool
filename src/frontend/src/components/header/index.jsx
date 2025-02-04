import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import {
  Navbar,
  NavbarBrand,
  Nav,
  NavbarToggler,
  NavItem,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Collapse
} from "reactstrap";

import {
  clearData,
  isUserLoggedIn
} from "../../actions/common";

import { NavLink } from "react-router-dom";
import "./header.css";

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dropdownOpen: false,
      isNavOpen: false,
    };

    this.toggleNav = this.toggleNav.bind(this);
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  toggleDropdown() {
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  toggleNav() {
    this.setState({ isNavOpen: !this.state.isNavOpen });
  }

  handleLogout() {
    clearData();
    this.props.history.push("/signIn");
  }

  render() {
    const { dropdownOpen } = this.state;

    return (
      <React.Fragment>
        <Navbar
          dark
          expand="md"
          id="header-container"
        >
          <div className="container-fluid">
            <NavbarToggler onClick={this.toggleNav} />
            <NavbarBrand className="mr-5" href="/">
              <img
                src="/assets/images/logo.jpg"
                height="42"
                width="54"
                alt="SoundCool"
              />
            </NavbarBrand>
            <Collapse isOpen={this.state.isNavOpen} navbar>
              <Nav navbar>

                <NavItem>
                  <NavLink className="nav-link text" to="/home">
                    <span className="fa header-text" /> Home
                  </NavLink>
                </NavItem>

                <NavItem>
                  <NavLink className="nav-link text" to="/about">
                    <span className="fa" /> About us
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink className="nav-link" to="/dashboard">
                    <span className="fas fa-columns" /> Dashboard
                  </NavLink>
                </NavItem>
                {isUserLoggedIn() && (

                  <NavItem>
                    <NavLink className="nav-link" to="/projectsList">
                      <span className="fa fa-project-diagram" /> Projects
                    </NavLink>
                  </NavItem>
                )}

                {isUserLoggedIn() && (
                  
                  <NavItem>
                    <NavLink className="nav-link" to="/medias">
                      <span className="fa fa-list " /> Media
                    </NavLink>
                  </NavItem>
                )}
                <NavItem>
                  <NavLink className="nav-link text" to="/contact">
                    <span className="fa" /> Contact us
                  </NavLink>
                </NavItem>

                {!isUserLoggedIn() && (
                  <NavItem>
                    <NavLink className="nav-link text" to="/signIn">
                      <span className="fa" /> Login
                    </NavLink>
                  </NavItem>
                )}
              </Nav>
              {isUserLoggedIn() && (
                <Nav className="ml-auto" navbar>
                  <Dropdown
                    nav
                    isOpen={dropdownOpen}
                    toggle={this.toggleDropdown}
                  >
                    <DropdownToggle nav caret>
                      <span className="fa fa-user-circle "></span>&nbsp;
                      {this.props.name}
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem>
                        <NavLink className="text-black" to="/user-profile">
                        <span className="fa fa-address-card " /> Edit Profile
                      </NavLink>
                      </DropdownItem>
                      <DropdownItem onClick={this.handleLogout}>
                        Logout
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </Nav>
              )}
            </Collapse>
          </div>
        </Navbar>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  blocks: state.blocks
});

export default withRouter(connect(mapStateToProps)(Header));