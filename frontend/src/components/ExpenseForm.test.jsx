import { fireEvent, render, screen } from "@testing-library/react";
import { expect, jest, test } from "@jest/globals";
import ExpenseForm from "./ExpenseForm";

const accounts = [{ id: "primary", bankName: "Test Bank", lastFour: "1234" }];

test("rejects a non-positive expense amount", () => {
  const onAdd = jest.fn();
  render(<ExpenseForm bankAccounts={accounts} onAdd={onAdd} />);

  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "-10" } });
  fireEvent.change(screen.getByLabelText("Bank account"), { target: { value: "primary" } });
  fireEvent.submit(screen.getByRole("button", { name: /add expense/i }).closest("form"));

  expect(screen.getByText("Amount must be greater than zero.")).toBeInTheDocument();
  expect(onAdd).not.toHaveBeenCalled();
});
