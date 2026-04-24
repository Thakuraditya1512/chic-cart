import React from "react";

const ShippingPolicy = () => (
  <div className="min-h-screen bg-background py-12 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Shipping Policy</h1>
      <p className="text-muted-foreground mb-8 text-center text-sm">Last updated: April 2026</p>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">1. No Shipping Provided</h2>
        <p className="text-sm text-muted-foreground">
          My Business does not ship goods. All products and services are delivered digitally or are for in-store pickup only.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">2. Order Confirmation</h2>
        <p className="text-sm text-muted-foreground">
          Upon successful payment, you will receive an order confirmation via email with details of your purchase and delivery method (if applicable).
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">3. Contact Us</h2>
        <p className="text-sm text-muted-foreground">
          For any questions regarding our shipping policy, please contact us at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a>.
        </p>
      </section>
    </div>
  </div>
);

export default ShippingPolicy;
