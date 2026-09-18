const fs = require("fs");
const path = require("path");
const vm = require("vm");

describe("Premium checkout client verification boundary", () => {
  let options;
  let opened;
  let checkout;
  beforeEach(() => {
    opened = jest.fn();
    const source = fs.readFileSync(path.join(__dirname, "../../src/services/razorpayCheckout.js"), "utf8")
      .replace("export const openRazorpayCheckout", "const openRazorpayCheckout");
    const window = { Razorpay: function Razorpay(input) { options = input; this.open = opened; } };
    const context = { window, setTimeout, clearTimeout };
    vm.runInNewContext(`${source}\nglobalThis.openCheckout = openRazorpayCheckout;`, context);
    checkout = context.openCheckout;
  });
  const order = { keyId: "rzp_test_phase13", orderId: "order_1", internalPaymentId: "payment_1",
    amountMinor: 39900, currency: "INR", name: "MyJourney Premium" };

  test("checkout waits for server verification instead of treating provider callback as membership", async () => {
    let verify;
    const verification = new Promise((resolve) => { verify = resolve; });
    const request = jest.fn().mockReturnValue(verification);
    const result = checkout(order, request);
    await Promise.resolve();
    await Promise.resolve();
    expect(opened).toHaveBeenCalledTimes(1);
    const callback = { razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "signed" };
    options.handler(callback);
    let settled = false;
    result.then(() => { settled = true; });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(request).toHaveBeenCalledWith({ internalPaymentId: "payment_1", ...callback });
    verify({ data: { status: "captured" } });
    await expect(result).resolves.toEqual({ data: { status: "captured" } });
  });

  test("server rejection propagates without client activation", async () => {
    const rejected = new Error("Invalid provider signature");
    const request = jest.fn().mockRejectedValue(rejected);
    const result = checkout(order, request);
    const expectation = expect(result).rejects.toThrow("Invalid provider signature");
    await Promise.resolve();
    await Promise.resolve();
    await options.handler({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "invalid" });
    await expectation;
  });

  test("dismissal verifies nothing and fails honestly", async () => {
    const request = jest.fn();
    const result = checkout(order, request);
    const expectation = expect(result).rejects.toThrow("Checkout closed");
    await Promise.resolve();
    await Promise.resolve();
    options.modal.ondismiss();
    await expectation;
    expect(request).not.toHaveBeenCalled();
  });
});
