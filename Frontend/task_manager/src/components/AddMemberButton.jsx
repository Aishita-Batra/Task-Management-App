import React from "react";
import Button from "react-bootstrap/Button";
import AddMemberModal from "./AddMemberModal";
import { useState } from "react";
import { currentAuthenticatedUser } from "../controllers/config";
import adduser from "../../assets/adduser.png"

const AddMemberButton = ({ onAddition, handleShowToast , projectOwnerEmail, handleOwnerShowAlert}) => {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const handleCloseAddMemberModal = () => setShowAddMemberModal(false);
  const handleAddMemberModal = async () => {
    const { username, userId, signInDetails } = await currentAuthenticatedUser();
    if (projectOwnerEmail !== signInDetails.loginId) {
      handleOwnerShowAlert();
    } else {
      setShowAddMemberModal(true);
    }
  }
  return (
    <>
      <Button
        className="btn addmember-btn"
        variant="dark"
        onClick={handleAddMemberModal}
      >
        <img src={adduser} className="addmember-img"></img>
        <div>Add Member</div>
      </Button>
      <AddMemberModal
        show={showAddMemberModal}
        handleClose={handleCloseAddMemberModal}
        onAddition={onAddition}
        handleShowToast={handleShowToast}
      />
    </>
  );
};
export default AddMemberButton;