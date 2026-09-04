import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../src/routers/ProtectedRoute";
import api from "../src/api/axios";

jest.mock("../src/api/axios",()=>({__esModule:true,default:{get:jest.fn()}}));

describe("ProtectedRoute",()=>{
  beforeEach(()=>{localStorage.clear();jest.clearAllMocks();});
  test("redirects a signed-out visitor to login",async()=>{
    render(<MemoryRouter initialEntries={["/dashboard"]}><Routes><Route path="/login" element={<div>Login screen</div>}/><Route path="/dashboard" element={<ProtectedRoute><div>Dashboard screen</div></ProtectedRoute>}/></Routes></MemoryRouter>);
    expect(await screen.findByText("Login screen")).toBeInTheDocument();
  });
  test("renders a verified user's protected page",async()=>{
    localStorage.setItem("token","test-token");
    api.get.mockResolvedValue({data:{is_verified:true}});
    render(<MemoryRouter initialEntries={["/dashboard"]}><Routes><Route path="/dashboard" element={<ProtectedRoute><div>Dashboard screen</div></ProtectedRoute>}/></Routes></MemoryRouter>);
    await waitFor(()=>expect(screen.getByText("Dashboard screen")).toBeInTheDocument());
  });
});
