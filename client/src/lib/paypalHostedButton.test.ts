import { describe, expect, it } from "vitest";
import { PAYPAL_HOSTED_BUTTON_ID, PAYPAL_SDK_SRC } from "./paypalHostedButton";

describe("botón alojado de PayPal", () => {
  it("conserva el identificador y el SDK de PayPal solicitados", () => {
    expect(PAYPAL_HOSTED_BUTTON_ID).toBe("N97QNJFPC6XX4");
    expect(PAYPAL_SDK_SRC).toContain("components=hosted-buttons");
    expect(PAYPAL_SDK_SRC).toContain("disable-funding=venmo");
    expect(PAYPAL_SDK_SRC).toContain("currency=USD");
  });
});
