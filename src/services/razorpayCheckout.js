let checkoutScript;

const loadCheckout = () => {
  if (window.Razorpay) return Promise.resolve();
  if (!checkoutScript) {
    checkoutScript = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const failed = () => { clearTimeout(timer); script.remove(); reject(new Error("Payment checkout is unavailable. Please try again.")); };
      const timer = setTimeout(failed, 10000);
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => { clearTimeout(timer); window.Razorpay ? resolve() : failed(); };
      script.onerror = failed;
      document.head.appendChild(script);
    }).catch((error) => { checkoutScript = null; throw error; });
  }
  return checkoutScript;
};

export const openRazorpayCheckout = async (checkout, verifyPayment) => {
  await loadCheckout();
  return new Promise((resolve, reject) => {
    let confirming = false;
    const dialog = new window.Razorpay({
      key: checkout.keyId, order_id: checkout.orderId,
      amount: checkout.amountMinor, currency: checkout.currency, name: checkout.name,
      handler: async (callback) => {
        confirming = true;
        try {
          resolve(await verifyPayment({ internalPaymentId: checkout.internalPaymentId,
            razorpay_order_id: callback.razorpay_order_id,
            razorpay_payment_id: callback.razorpay_payment_id,
            razorpay_signature: callback.razorpay_signature }));
        } catch (error) { reject(error); }
      },
      modal: { ondismiss: () => {
        if (!confirming) reject(new Error("Checkout closed. Your membership status can be checked in your account."));
      } },
    });
    dialog.open();
  });
};
