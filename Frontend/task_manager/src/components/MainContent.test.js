import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom'
import MainContent from "./MainContent";
describe("MainContent component", () => {
  it("renders greetings and current date", () => {
    render(<MainContent />);
    const greetingsElement = screen.getByText("Greetings, Welcome to Task Manager!");
    expect(greetingsElement).toBeInTheDocument();
  });
});