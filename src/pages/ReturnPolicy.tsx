import React from "react";

const ReturnPolicy = () => (
  <div className="min-h-screen bg-background py-12 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Return Policy</h1>
      <p className="text-muted-foreground mb-8 text-center text-sm">Last updated: April 2026</p>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">1. No Returns Accepted</h2>
        <p className="text-sm text-muted-foreground">
          My Business does not support returns. All sales are final. Please review your order carefully before completing your purchase.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">2. Damaged or Defective Items</h2>
        <p className="text-sm text-muted-foreground">
          If you receive a damaged or defective product, please contact our support team within 48 hours of delivery at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a> with your order details and photos of the issue. We will review your case and assist you accordingly.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">3. Contact Us</h2>
        <p className="text-sm text-muted-foreground">
          For any questions regarding our return policy, please contact us at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a>.
        </p>
      </section>
    </div>
  </div>
);

export default ReturnPolicy;
