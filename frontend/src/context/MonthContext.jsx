/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from "react";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const MonthContext = createContext({ selectedMonth: currentMonth(), setSelectedMonth: () => {} });

export function MonthProvider({ children }) {
  const [selectedMonth, setSelectedMonthState] = useState(() => localStorage.getItem("budgetbuddy-selected-month") || currentMonth());
  const setSelectedMonth = (value) => {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return;
    localStorage.setItem("budgetbuddy-selected-month", value);
    setSelectedMonthState(value);
  };
  const value = useMemo(() => ({ selectedMonth, setSelectedMonth }), [selectedMonth]);
  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  return useContext(MonthContext);
}
