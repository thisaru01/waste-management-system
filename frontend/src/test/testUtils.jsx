import React from "react";
import { render } from "@testing-library/react";
import { AuthProvider } from "../context/AuthContext.jsx";
import { MemoryRouter } from "react-router-dom";

export function renderWithProviders(
  ui,
  { route = "/", initialEntries = [route] } = {}
) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </AuthProvider>
  );
}
