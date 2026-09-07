import { render, screen, waitFor } from "@testing-library/react";
import { expect, jest, test } from "@jest/globals";
import Dashboard from "./Dashboard";
import { getDashboard } from "../services/dashboardService";

jest.mock("../services/dashboardService", () => ({ getDashboard: jest.fn() }));
jest.mock("../components/charts/BarChartCard", () => () => <div>bar chart</div>);
jest.mock("../components/charts/PieChartCard", () => () => <div>pie chart</div>);
jest.mock("../components/ProgressCards", () => () => <div>progress cards</div>);
jest.mock("../components/RecentTransactions", () => () => <div>recent transactions</div>);

test("renders dashboard summary with mocked API data", async () => {
  getDashboard.mockResolvedValue({
    summary: { total_income: 2500, total_expense: 400, balance: 2100, savings: 2100 },
    monthly_income: [], monthly_expense: [], expense_categories: [], recent_transactions: [],
  });

  render(<Dashboard />);
  await waitFor(() => expect(screen.getByText("Overview")).toBeInTheDocument());
  expect(screen.getByText(/Total income/i)).toBeInTheDocument();
  expect(screen.getByText(/Total expenses/i)).toBeInTheDocument();
});
