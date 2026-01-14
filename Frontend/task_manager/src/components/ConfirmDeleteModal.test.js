import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import '@testing-library/jest-dom';
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { useParams } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import {removeTeamMember} from "../controllers/memberops";
jest.mock("../controllers/memberops", () => ({
  removeTeamMember: jest.fn(),
}));
const mockRemoveTeamMember = require("../controllers/memberops").removeTeamMember;
const mockHandleShowAlert = jest.fn();
const mockHandleClose = jest.fn();
const mockOnRemove = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useParams: jest.fn(),
  }));

const renderComponent = (props) => {
  return render(
    <BrowserRouter>
      <ConfirmDeleteModal {...props} />
    </BrowserRouter>
  );
};

describe("ConfirmDeleteModal Component", () => {
  const baseProps = {
    member: { name: "John Doe", email: "john.doe@example.com" },
    show: true,
    handleClose: mockHandleClose,
    onRemove: mockOnRemove,
    projectOwnerEmail: "owner@example.com",
    handleShowAlert: mockHandleShowAlert,
  };
  beforeEach(() => {
    useParams.mockReturnValue({ project_id: "12" });
  });
  it("should display the modal with the correct text", () => {
    renderComponent(baseProps);
    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure that you want to remove John Doe from the team?")
    ).toBeInTheDocument();
    expect(screen.getByText("Yes, Remove")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
  });
  it("should call handleClose when No button is clicked", () => {
    renderComponent(baseProps);
    fireEvent.click(screen.getByText("No"));
    expect(mockHandleClose).toHaveBeenCalled();
  });
  it("should call handleShowAlert and handleClose when the member is the project owner", () => {
    const props = {
      ...baseProps,
      member: { name: "Project Owner", email: "owner@example.com" },
    };
    renderComponent(props);
    fireEvent.click(screen.getByText("Yes, Remove"));
    expect(mockHandleShowAlert).toHaveBeenCalled();
    expect(mockHandleClose).toHaveBeenCalled();
  });
  it("should call onRemove, removeTeamMember, and handleClose when member is not the project owner", () => {
    renderComponent(baseProps);
    fireEvent.click(screen.getByText("Yes, Remove"));
    expect(mockOnRemove).toHaveBeenCalledWith("john.doe@example.com");
    expect(mockRemoveTeamMember).toHaveBeenCalledWith('12',"john.doe@example.com");
    expect(mockHandleClose).toHaveBeenCalled();
  });
});






