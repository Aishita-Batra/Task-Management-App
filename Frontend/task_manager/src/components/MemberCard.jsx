import React from "react";
import { Button } from "react-bootstrap";
import Card from "react-bootstrap/Card";
import { Row, Col } from "react-bootstrap";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import "../css/App.css";
import "bootstrap/dist/css/bootstrap.css";
import { currentAuthenticatedUser } from "../controllers/config";
const MemberCard = ({
  member,
  onRemove,
  projectOwnerEmail,
  handleShowAlert,
  handleOwnerShowAlert
}) => {
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const handleCloseConfirmDeleteModal = () => setShowConfirmDeleteModal(false);
  const handleShowConfirmDeleteModal = () => setShowConfirmDeleteModal(true);
  const handleRemove = async() => {
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
    if(signInDetails.loginId !== projectOwnerEmail){
      handleOwnerShowAlert();
    }else{
      handleShowConfirmDeleteModal();
    }
  };
  return (
    <Card className="w-100 mb-2">
      <Card.Body>
        <Row>
          <Col>
            <Card.Title>{member.name}</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {member.email}
            </Card.Subtitle>
          </Col>
          <Col md="auto">
            <Button
              className="btn remove-btn"
              onClick={handleRemove}
            >
              Remove
            </Button>
            <ConfirmDeleteModal
              member={member}
              show={showConfirmDeleteModal}
              handleClose={handleCloseConfirmDeleteModal}
              onRemove={onRemove}
              projectOwnerEmail={projectOwnerEmail}
              handleShowAlert={handleShowAlert}
            />
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};
export default MemberCard;