import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProviderForm } from "@/components/ProviderForm";
import { splitServiceType } from "@/lib/provider-validation";

afterEach(cleanup);

function form(category: string, categorySelected = true) {
  const onSubmit = vi.fn().mockResolvedValue(null);
  render(<ProviderForm
    initial={{ name: "ABC Electric", ...splitServiceType(category), phone: "555-0100", notes: "Keep contact" }}
    categorySelected={categorySelected}
    submitLabel="Save Provider"
    onSubmit={onSubmit}
    onCancel={() => {}}
  />);
  return onSubmit;
}

describe("provider expense category saving", () => {
  it("saves the previously selected Electrician category independently of the provider name", async () => {
    const save = form("Electrician");
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({
      name: "ABC Electric", service_type: "Electrician", phone_or_contact: "555-0100", notes: "Keep contact",
    }));
  });

  it("saves an existing custom category selected upstream without re-entering it", async () => {
    const save = form("Plumber");
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ service_type: "Plumber" })));
  });

  it("requires and saves custom text for a newly selected Other category", async () => {
    const save = form("");
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    expect(save).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Custom Expense Type *" }), { target: { value: "Cleaner" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ service_type: "Cleaner" })));
  });

  it.each(["A/C", "Air Conditioner", "Plumber", "Electrician"])("loads and preserves the existing %s category when editing other fields", async (category) => {
    const save = form(category, false);
    fireEvent.change(screen.getByRole("textbox", { name: "Name *" }), { target: { value: "Updated company" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: "Updated company", service_type: category })));
  });

  it("allows category changes through the single edit selection", async () => {
    const save = form("Gardener", false);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Electrician" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Provider" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ service_type: "Electrician" })));
  });
});