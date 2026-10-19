import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VisitForm } from "@/components/VisitForm";
import { GroceryForm } from "@/components/GroceryForm";
import { validateVisit } from "@/lib/visit-validation";
import { validateGrocery } from "@/lib/grocery-validation";
afterEach(cleanup);
const visit = { visitDate: "2026-10-19", service: "Repair", amount: "75", notes: "", paid: null };
describe("deliberate expense payment choice", () => {
  it("requires a choice for services without inferring No from amount", () => {
    const result = validateVisit(visit);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.paid).toBeTruthy();
  });
  it("requires a choice for groceries without silently marking unpaid", () => {
    const result = validateGrocery({ purchaseDate: "2026-10-19", store: "Cold Storage", amount: "75", notes: "", reimbursed: null });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.reimbursed).toBeTruthy();
  });
  it("submits service identity, visit, deliberate status and receipt together", async () => {
    const save = vi.fn().mockResolvedValue(null);
    render(<VisitForm initial={visit} expenseType="Electrician" providerInitial={{ name: "ABC Electric", phone: "123" }} submitLabel="Save Expense" onSubmit={save} onCancel={() => {}} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Save Expense" }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    const file = new File(["image"], "receipt.jpg", { type: "image/jpeg" });
    fireEvent.change(screen.getByLabelText("Upload Receipt"), { target: { files: [file] } });
    fireEvent.click(screen.getByRole("button", { name: "Save Expense" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ data: { visit_date: "2026-10-19", service_performed: "Repair", amount_paid: 75, notes: null, paid: false }, provider: { name: "ABC Electric", phone_or_contact: "123", service_type: "Electrician" }, file, removeReceipt: false }));
  });
  it("groceries begin unselected and save an explicit Yes", async () => {
    const save = vi.fn().mockResolvedValue(null);
    render(<GroceryForm initial={{ purchaseDate: "2026-10-19", store: "Cold Storage", amount: "75", notes: "", reimbursed: null }} submitLabel="Save Purchase" onSubmit={save} onCancel={() => {}} />);
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Save Purchase" }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Purchase" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ reimbursed: true }) })));
  });
  it.each([true, false])("editing preserves saved Paid=%s", (paid) => {
    render(<VisitForm initial={{ ...visit, paid }} submitLabel="Save Changes" onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByRole("radio", { name: paid ? "Yes" : "No" })).toBeChecked();
  });
});