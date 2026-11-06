import { describe, expect, it } from "vitest";
import { formCheckbox } from "./form-utils";

function body(entries: [string, string][]) {
  const formData = new FormData();
  for (const [key, value] of entries) formData.append(key, value);
  return formData;
}

describe("formCheckbox", () => {
  it("lee marcada aunque el oculto vaya primero", () => {
    // Este es el caso que estaba roto en el panel: con el oculto antes de la
    // casilla, `get` devolvía "false" y marcarla no cambiaba nada.
    expect(formCheckbox(body([["isActive", "false"], ["isActive", "true"]]), "isActive")).toBe(true);
  });

  it("lee marcada con el oculto después", () => {
    expect(formCheckbox(body([["isActive", "true"], ["isActive", "false"]]), "isActive")).toBe(true);
  });

  it("lee desmarcada cuando solo viaja el oculto", () => {
    expect(formCheckbox(body([["isActive", "false"]]), "isActive")).toBe(false);
  });

  it("lee desmarcada cuando el campo no viaja", () => {
    expect(formCheckbox(body([]), "isActive")).toBe(false);
  });

  it("no confunde campos distintos", () => {
    const formData = body([["otro", "true"], ["isActive", "false"]]);

    expect(formCheckbox(formData, "isActive")).toBe(false);
    expect(formCheckbox(formData, "otro")).toBe(true);
  });
});
