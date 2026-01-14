import { useEffect, useState } from 'react';
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { Button } from "react-bootstrap";
import "../css/App.css";
import hamburgericon from '../../assets/hamburgericon.png'
import logouticon from '../../assets/logout.png'
import{
currentSession,
} from "../controllers/config.jsx";

function MyNavBar(params) {
  const [name,setName]=useState("");
  const getusername=async ()=>{
    const { uname } = await currentSession();
    console.log(uname);
    setName(uname);
  }

  useEffect(()=>{
    getusername();
  },[])

  // console.log(params.user);
  return (
    <>
      <Nav className="navbar-container">
        <div className="nav-heading">
          <h5 href="#home" className="appname fw-bold">
            TASK MANAGER
          </h5>
          </div>
          <div className='navbar-right'>
          <div>{name}</div>
            <Button
              variant="dark"
              size="sm"
              className="btn logout-btn"
              onClick={() => {
                params.signOut();  //sign out function sent from app.js in params
              }}
            >
              <img className="logout-icon" src={logouticon}></img>
              LOGOUT
            </Button>
            </div>
      </Nav>
    </>
  );
}

export default MyNavBar;
