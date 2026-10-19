import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VisitForm } from "@/components/VisitForm";
import { GroceryForm } from "@/components/GroceryForm";
import { serviceExample, validateVisit } from "@/lib/visit-validation";
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

describe("service form cleanup", () => {
  const renderVisit = (expenseType: string) => render(<VisitForm initial={visit} expenseType={expenseType} providerInitial={{ name: "", phone: "" }} submitLabel="Save Expense" onSubmit={vi.fn()} onCancel={() => {}} />);
  it("marks Paid as required with an asterisk on service and grocery forms", () => {
    renderVisit("Gardener");
    expect(screen.getByText("Paid? *")).toBeTruthy();
    cleanup();
    render(<GroceryForm initial={{ purchaseDate: "2026-10-19", store: "Cold Storage", amount: "75", notes: "", reimbursed: null }} submitLabel="Save Purchase" onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByText("Paid? *")).toBeTruthy();
  });
  it("uses the simpler Phone and Date labels", () => {
    renderVisit("Gardener");
    expect(screen.getByLabelText("Phone")).toBeTruthy();
    expect(screen.queryByLabelText("Phone or contact")).toBeNull();
    expect(screen.getByLabelText("Date *")).toBeTruthy();
    expect(screen.queryByLabelText("Visit Date *")).toBeNull();
  });
  it("Service Performed is optional and saves blank", async () => {
    const save = vi.fn().mockResolvedValue(null);
    render(<VisitForm initial={{ ...visit, service: "" }} expenseType="Gardener" providerInitial={{ name: "Ken", phone: "" }} submitLabel="Save Expense" onSubmit={save} onCancel={() => {}} />);
    expect(screen.getByLabelText("Service Performed")).toBeTruthy();
    expect(screen.queryByLabelText("Service Performed *")).toBeNull();
    fireEvent.click(screen.getByRole("radio", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Expense" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ service_performed: "" }) })));
  });
  it.each([
    ["Gardener", "e.g. Trimmed hedges, mowed lawn"],
    ["Jacuzzi", "e.g. Cleaned filters, balanced chemicals"],
    ["Aircon", "e.g. Serviced unit, cleaned filters"],
    ["Electrician", "e.g. Replaced outlet, fixed lighting"],
    ["House Painting", "e.g. Painted bedroom, touched up walls"],
  ])("%s gets its own Service Performed example", (type, example) => {
    renderVisit(type);
    expect(screen.getByPlaceholderText(example)).toBeTruthy();
  });
  it("Other has no Service Performed example", () => {
    renderVisit("Other");
    expect(screen.getByLabelText("Service Performed").getAttribute("placeholder")).toBeNull();
  });
  it("legacy A/C maps to the Aircon example", () => expect(serviceExample("A/C")).toBe("e.g. Serviced unit, cleaned filters"));
  it("changing Expense Type updates the placeholder immediately", () => {
    const view = renderVisit("Gardener");
    expect(screen.getByPlaceholderText("e.g. Trimmed hedges, mowed lawn")).toBeTruthy();
    view.rerender(<VisitForm initial={visit} expenseType="Electrician" providerInitial={{ name: "", phone: "" }} submitLabel="Save Expense" onSubmit={vi.fn()} onCancel={() => {}} />);
    expect(screen.getByPlaceholderText("e.g. Replaced outlet, fixed lighting")).toBeTruthy();
  });
  it("placeholder text is never stored as Service Performed data", async () => {
    const save = vi.fn().mockResolvedValue(null);
    render(<VisitForm initial={{ ...visit, service: "" }} expenseType="Gardener" providerInitial={{ name: "Ken", phone: "" }} submitLabel="Save Expense" onSubmit={save} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole("radio", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Expense" }));
    await waitFor(() => expect(save).toHaveBeenCalled());
    expect(save.mock.calls[0]?.[0].data.service_performed).toBe("");
  });
});