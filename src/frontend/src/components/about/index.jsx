import React from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  CardHeader,
  Media
} from "reactstrap";

import { Link } from "react-router-dom";

function About(props) {
  const leaders = props.leaders.map(leader => {
    return (
      <div key={leader.id} className="col mt-1">
        <RenderLeader leader={leader} />
      </div>
    );
  });

  function RenderLeader({ leader }) {
    return (
      <Media tag="li">
        {/* <Media left middle>
          <Media object width="120px" src={leader.image} alt={leader.name} />
        </Media> */}
        <Media body className="">
          <Media heading>{leader.name}</Media>
          <p>{leader.designation}</p>
          {/* <p>{leader.description}</p> */}
        </Media>
      </Media>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <Breadcrumb>
          <BreadcrumbItem>
            <Link to="/home">Home</Link>
          </BreadcrumbItem>
          <BreadcrumbItem active>About Us</BreadcrumbItem>
        </Breadcrumb>
        <div className="col-12">
          <h3>About Us</h3>
          <hr />
        </div>
      </div>
      <div
        className="row row-content"
        style={{ padding: "0px", minHeight: "0px" }}
      >
        <div className="col-12 col-md-6">
          <h2>Our Goal</h2>
          <p>
            Soundcool is a system for collaborative creation through mobile,
            tablet, hololens.
            The system has been created by the Polytechnic University of
            Valencia with an international collaboration of universities and
            institutions.
          </p>
          <p>
            Soundcool Web Audio is a port of Soundcool from its original
            implementation in MaxMSP to Web technologies to enable greater
            portability and eventually a free cloud-based system where
            Soundcool users can learn, create, and share.
            See &nbsp;<a href="http://soundcool.org">http://soundcool.org</a>
            for the computer and playstore/iOS applications and other
            running projects.
          </p>
        </div>
{/*
        <div className="col-12">
          <Card>
            <CardBody className="bg-faded">
              <blockquote className="blockquote">
                <p className="mb-0">SoundCool for the next regeneration.</p>
                <footer className="blockquote-footer">
                  XX,
                  <cite title="Source Title">YY</cite>
                </footer>
              </blockquote>
            </CardBody>
          </Card>
        </div>
*/}
      </div>
      <div
        className="row row-content"
        style={{ padding: "0px", minHeight: "0px" }}
      >
        <div className="col-12">
          <h2>Soundcool Web Audio Team</h2>
        </div>
        <div className="col-12">
          <Media list className="row"
                 style={{ padding: "0px", wordBreak:"break-word",
                          height: "auto" }}>
            {leaders}
          </Media>
        </div>
      </div>
    </div>
  );
}

export default About;
