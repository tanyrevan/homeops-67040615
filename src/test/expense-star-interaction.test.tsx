import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpenseSection } from "@/components/ExpenseSection";
import type { HistoryItem } from "@/lib/list-filters";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a href="/detail" onClick={(e) => e.preventDefault()}>{children}</a> }));
vi.mock("@/lib/visits-api", () => ({ day: (d: string) => d, money: (n: number) => `$${n}` }));
afterEach(cleanup);

describe("expense star interaction", () => {
  it("keeps transactions usable when star data and handlers have not arrived", () => {
    const record: HistoryItem = { kind: "grocery", id: "pending", date: "2026-10-18", type: "Grocery", title: "", subtitle: "", amount: 10, settled: false, receipt_url: null, created_at: "2026-10-18" };
    const paid = vi.fn();
    const view = render(<ExpenseSection items={[record]} settlingKey={null} saving={false} onMarkPaid={paid} />);
    fireEvent.click(screen.getByRole("button", { name: "Mark Paid" }));
    expect(paid).toHaveBeenCalledWith(record);
    const toggle = vi.fn();
    view.rerender(<ExpenseSection items={[record]} stars={new Set()} onToggleStar={toggle} settlingKey={null} saving={false} onMarkPaid={paid} />);
    fireEvent.click(screen.getByRole("button", { name: "Star Grocery expense on 2026-10-18" }));
    expect(toggle).toHaveBeenCalledWith(record);
  });
  it.each([true, false])("toggles both transaction kinds without triggering detail navigation (upcoming=%s)", (upcoming) => {
    const onToggleStar = vi.fn();
    const records: HistoryItem[] = (["visit", "grocery"] as const).map((kind) => ({ kind, id: kind, date: "2026-10-18", type: kind === "visit" ? "Gardener" : "Grocery", title: "", subtitle: "", amount: 10, settled: false, receipt_url: null, created_at: "2026-10-18" }));
    render(<ExpenseSection items={records} upcoming={upcoming} stars={new Set(["grocery-grocery"])} starring={false} settlingKey={null} saving={false} onMarkPaid={vi.fn()} onToggleStar={onToggleStar} />);
    const navigate = vi.fn();
    screen.getAllByRole("link").forEach((link) => link.addEventListener("click", navigate));
    fireEvent.click(screen.getByRole("button", { name: "Star Gardener expense on 2026-10-18" }));
    fireEvent.click(screen.getByRole("button", { name: "Unstar Grocery expense on 2026-10-18" }));
    expect(onToggleStar.mock.calls).toEqual([[records[0]], [records[1]]]);
    expect(navigate).not.toHaveBeenCalled();
    const firstLink = screen.getAllByRole("link")[0];
    if (!firstLink) throw new Error("Missing transaction link");
    fireEvent.click(firstLink);
    expect(navigate).toHaveBeenCalledTimes(1);
  });
});