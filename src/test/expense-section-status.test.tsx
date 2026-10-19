import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpenseSection } from "@/components/ExpenseSection";
import type { HistoryItem } from "@/lib/list-filters";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a href="/detail" onClick={(e) => e.preventDefault()}>{children}</a> }));
vi.mock("@/lib/visits-api", () => ({ day: (d: string) => d, money: (n: number | null) => (n == null ? null : `$${n}`) }));
afterEach(cleanup);

const item = (id: string, settled: boolean, amount: number | null = 50): HistoryItem => ({ kind: "visit", id, date: "2026-11-01", type: "Plumber", title: "", subtitle: "", amount, settled, receipt_url: null, created_at: "2026-10-18" });
const renderSection = (items: HistoryItem[], upcoming: boolean) => render(<ExpenseSection items={items} upcoming={upcoming} settlingKey={null} saving={false} onMarkPaid={vi.fn()} />);

describe("Upcoming payment status", () => {
  it("shows the Paid badge on a settled Upcoming expense", () => {
    renderSection([item("a", true)], true);
    expect(screen.getByText("✓ Paid")).toBeTruthy();
  });
  it("shows the Unpaid badge on an unsettled Upcoming expense", () => {
    renderSection([item("a", false)], true);
    expect(screen.getByText("Unpaid")).toBeTruthy();
  });
  it("still shows the status when the amount is missing", () => {
    renderSection([item("a", false, null)], true);
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("Unpaid")).toBeTruthy();
  });
  it("does not add Mark Paid to Upcoming", () => {
    renderSection([item("a", false)], true);
    expect(screen.queryByRole("button", { name: "Mark Paid" })).toBeNull();
  });
});

describe("History status display", () => {
  it("remains unchanged: Paid badge and no badge duplication", () => {
    renderSection([item("a", true), item("b", false)], false);
    const list = screen.getByRole("list");
    expect(within(list).getByText("✓ Paid")).toBeTruthy();
    expect(within(list).getByText("Unpaid")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark Paid" })).toBeTruthy();
  });
});
