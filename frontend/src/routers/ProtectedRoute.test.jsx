import { render, screen } from "@testing-library/react";
import { expect, test } from "@jest/globals";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

test("redirects to login when no token exists", () => {
  localStorage.clear();
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<ProtectedRoute><div>private dashboard</div></ProtectedRoute>} />
        <Route path="/login" element={<div>login page</div>} />
      </Routes>
    </MemoryRouter>,
  );

  expect(screen.getByText("login page")).toBeInTheDocument();
});
