import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders sign in screen', () => {
  render(<App />);
  const titleElement = screen.getByText(/Sign In/i);
  expect(titleElement).toBeInTheDocument();
});
