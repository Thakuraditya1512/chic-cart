import React from "react";

const TermsAndConditions = () => (
  <div className="min-h-screen bg-background py-12 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl bg-white rounded-lg shadow-md p-8">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center">Terms and Conditions</h1>
      <p className="text-muted-foreground mb-8 text-center text-sm">Last updated: April 2026</p>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">1. Acceptance of Terms</h2>
        <p className="text-sm text-muted-foreground">
          By accessing or using our website and services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">2. Use of the Website</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>You must be at least 18 years old or have the involvement of a parent or guardian to use our services.</li>
          <li>You agree not to use the website for any unlawful purpose or in violation of any applicable laws.</li>
          <li>All content provided on this site is for informational purposes only and may be changed without notice.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">3. Intellectual Property</h2>
        <p className="text-sm text-muted-foreground">
          All content, trademarks, logos, and intellectual property displayed on this website are the property of their respective owners. You may not use, reproduce, or distribute any content without prior written permission.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">4. Orders and Payments</h2>
        <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
          <li>All orders placed are subject to acceptance and availability.</li>
          <li>We reserve the right to refuse or cancel any order at our discretion.</li>
          <li>Payments must be made in full at the time of purchase using the available payment methods.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">5. Limitation of Liability</h2>
        <p className="text-sm text-muted-foreground">
          We are not liable for any indirect, incidental, or consequential damages arising from the use of our website or services. Our total liability is limited to the amount paid by you for the product or service.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="font-semibold text-lg mb-2">6. Changes to Terms</h2>
        <p className="text-sm text-muted-foreground">
          We reserve the right to update or modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on this page. Please review this page periodically for updates.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-lg mb-2">7. Contact Us</h2>
        <p className="text-sm text-muted-foreground">
           If you have any questions about these Terms and Conditions, please contact us at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a>.
        </p>
      </section>
    </div>
  </div>
);

export default TermsAndConditions;
