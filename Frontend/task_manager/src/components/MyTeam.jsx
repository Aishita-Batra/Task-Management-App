import React from "react";
import { useLocation } from "react-router-dom";
import MemberCard from "./MemberCard";
import { fetchMembers } from "../controllers/memberops";
import rotate from "../../assets/rotate.png";
import Button from "react-bootstrap/Button";
import {
  Container,
  Row,
  Col,
  Alert,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import AddMemberButton from "./AddMemberButton";
import { useState } from "react";
import "../css/App.css";


const MyTeam = () => {
  const { project_id } = useParams();
  const location = useLocation();
  const projectOwnerEmail = location.state?.projectData;
  const projectName = location.state?.projectName;
  const projectOwnerName= location.state?.projectOwnerName
  //
  const projectDesc=location.state?.projectDesc;
  const [teamMembers, setTeamMembers] = React.useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [addResponse, setAddResponse] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showOwnerAlert, setShowOwnerAlert] = useState(false);
  //
  const projectObj = {
    projectId: project_id,
    projectName: projectName,
    projectDescription: projectDesc,
    projectOwnerEmail: projectOwnerEmail,
    projectOwnerName: projectOwnerName
  };
  const handleShowAlert = () => {
    setShowAlert(true);
  };

  //fetch team members from the database
  const fetchTeamMembers = async () => {
    const members = await fetchMembers(project_id);
    console.log(members.length);
    setTeamMembers(members);
  };
  //function to remove a member with the specified email from the team
  const onRemoval = (email) => {
    setTeamMembers((teamMembers) =>
      teamMembers.filter((member) => member.email !== email)
    );
  };
  //function to add new member to the team
  const onAddition = (newMember) => {
    setTeamMembers((teamMembers) => [...teamMembers, newMember]);
  };

  const handleShowToast = (response) => {
    if (response.statusCode === 200) {
      setAddResponse("Team member added successfully");
    } else {
      setAddResponse(response.body);
    }
    setShowToast(true);
  };
  const handleOwnerShowAlert = () => {
    setShowOwnerAlert(true);
  };

  React.useEffect(() => {
    fetchTeamMembers();
  }, []);

  return (
    <>
      {/* show toast with the response message whenever a team member is added */}
      {showToast && (
        <ToastContainer style={{ zIndex: 1 }} position="top-center">
          <Toast
            className="d-inline-block m-1"
            bg={
              addResponse === "Team member added successfully"
                ? "success"
                : "secondary"
            }
            onClose={() => setShowToast(false)}
          >
            <Toast.Header>
              <strong className="me-auto">Update</strong>
            </Toast.Header>
            <Toast.Body className="text-white">{addResponse}</Toast.Body>
          </Toast>
        </ToastContainer>
      )}

      <h4 className="text-center underlined">{projectName}</h4>

      <br></br>

      <Container fluid className="my-3  team-container">
        <Row className="mx-1 mb-2">
          <Col>
            <h4>Team Members</h4>
          </Col>
          <Col md="auto">
            <Button className="refresh-btn" onClick={fetchTeamMembers}>
              <img className="rotate-img" src={rotate} />
            </Button>
          </Col>
        </Row>

        {/* show alert on attempt of removing project owner from the team  */}
        {showAlert && (
          <Alert
            variant="warning"
            onClose={() => setShowAlert(false)}
            dismissible
          >
           Project Owner cannot be removed from the team.
          </Alert>
        )}
        {showOwnerAlert && (
          <Alert
            variant="info"
            onClose={() => setShowOwnerAlert(false)}
            dismissible
          >
            Only Project Owner can perform this operation.
          </Alert>
        )}

        {
          teamMembers.map((member, index) => (
            <Row key={index} className="mx-1">
              <MemberCard
                member={member}
                onRemove={onRemoval}
                projectOwnerEmail={projectOwnerEmail}
                handleShowAlert={handleShowAlert}
                handleOwnerShowAlert={handleOwnerShowAlert}
              />
            </Row>
          ))
        }
      </Container>

      <AddMemberButton
        onAddition={onAddition}
        handleShowToast={handleShowToast}
        projectOwnerEmail={projectOwnerEmail}
        handleOwnerShowAlert={handleOwnerShowAlert}
      />
    </>
  );
};
export default MyTeam;