import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DisplayCurrentDate from './DisplayCurrentDate';
jest.useFakeTimers();
describe('DisplayCurrentDate component', () => {
  it('displays the current date', () => {
    render(<DisplayCurrentDate />);
    const currentDate = new Date();
    const day = String(currentDate.getDate()).padStart(2, '0');
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const year = String(currentDate.getFullYear()).slice(2);
    const expectedDate = `${day}-${month}-${year}`;
    const dateElement = screen.getByText(expectedDate);
    expect(dateElement).toBeInTheDocument();
  });
});



