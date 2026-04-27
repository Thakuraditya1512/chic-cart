import React from "react";

const RefundPolicy = () => (
  <div className="min-h-screen bg-background py-12 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Refund Policy</h1>
      <p className="text-muted-foreground mb-8 text-center text-sm">Last updated: April 2026</p>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">1. Eligibility for Refunds</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Refunds are available for products that are defective, damaged, not as described, or if you are unsatisfied with your purchase.</li>
          <li>Requests for refunds must be made within 7 days of delivery.</li>
          <li>To be eligible, items must be unused, in their original packaging, and accompanied by proof of purchase.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">2. Refund Process</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Contact our support team at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a> with your order details and reason for refund.</li>
          <li>Once your return is received at our warehouse and inspected, we will initiate the refund process within 7 days.</li>
          <li>Refunds are processed and credited within 5-7 business days after we receive the returned item.</li>
          <li>The amount is credited back to your original payment method.</li>
          <li>The entire refund process (from warehouse receipt to payment) will be completed within 15 days.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">3. Exchange Policy</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Exchanged products will be delivered within 3-7 days.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">4. Non-Refundable Items</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Gift cards and downloadable products are non-refundable.</li>
          <li>Items marked as final sale cannot be refunded.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">5. Late or Missing Refunds</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>If you haven’t received a refund yet, first check your bank account again.</li>
          <li>Then contact your credit card company or bank; it may take some time before your refund is officially posted.</li>
          <li>If you’ve done all of this and still have not received your refund, please contact us at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a>.</li>
        </ul>
      </section>
    </div>
  </div>
);

export default RefundPolicy;
