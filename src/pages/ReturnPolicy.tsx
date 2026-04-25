import React from "react";


const ReturnPolicy = () => (
  <div className="min-h-screen bg-background py-12 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Return Policy</h1>
      <p className="text-muted-foreground mb-8 text-center text-sm">Last updated: April 2026</p>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">1. Return Eligibility</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>We accept returns for products that are unused, in their original packaging, and accompanied by proof of purchase.</li>
          <li>Return requests must be made within 7 days of delivery.</li>
          <li>Items must be shipped back to our warehouse at your expense unless the product is defective or damaged.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">2. Return Process</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Contact our support team at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a> with your order details and reason for return.</li>
          <li>Once your return is received at our warehouse and inspected, we will initiate the refund process within 7 days.</li>
          <li>The refund will be processed to your original payment method within 5 days after initiation.</li>
          <li>The entire process (from warehouse receipt to payment) will be completed within 15 days after the product reaches our warehouse.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">3. Non-Returnable Items</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>Gift cards and downloadable products are non-returnable.</li>
          <li>Items marked as final sale cannot be returned.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">4. Contact Us</h2>
        <p className="text-sm text-muted-foreground">
          For any questions regarding our return or refund policy, please contact us at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a>.
        </p>
      </section>
    </div>
  </div>
);

export default ReturnPolicy;
