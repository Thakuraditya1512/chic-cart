import React from "react";
import { Link } from "react-router-dom";

const TermsAndConditions = () => (
  <div className="min-h-screen bg-background py-12 sm:py-16">
    <div className="container mx-auto px-4 sm:px-6 max-w-3xl bg-white rounded-lg shadow-md p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
      >
        <span className="material-icons">arrow_back</span>
        Back to Home
      </Link>
      <div className="text-center mb-10 sm:mb-12">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
          Terms and Conditions
        </h1>
        <p className="text-muted-foreground font-sans text-sm">
          Last updated: April 2026
        </p>
      </div>
      <div className="space-y-8">
        <section>
          <h2 className="font-display text-lg font-bold mb-3">1. Acceptance of Terms</h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            By accessing or using our website and services, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold mb-3">2. Use of the Website</h2>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
            <li>You must be at least 18 years old or have the involvement of a parent or guardian to use our services.</li>
            <li>You agree not to use the website for any unlawful purpose or in violation of any applicable laws.</li>
            <li>All content provided on this site is for informational purposes only and may be changed without notice.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold mb-3">3. Intellectual Property</h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            All content, trademarks, logos, and intellectual property displayed on this website are the property of their respective owners. You may not use, reproduce, or distribute any content without prior written permission.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold mb-3">4. Orders and Payments</h2>
          <ul className="list-disc pl-6 text-sm text-muted-foreground space-y-2">
            <li>All orders placed are subject to acceptance and availability.</li>
            <li>We reserve the right to refuse or cancel any order at our discretion.</li>
            <li>Payments must be made in full at the time of purchase using the available payment methods.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold mb-3">5. Limitation of Liability</h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            We are not liable for any indirect, incidental, or consequential damages arising from the use of our website or services. Our total liability is limited to the amount paid by you for the product or service.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold mb-3">6. Changes to Terms</h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            We reserve the right to update or modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on this page. Please review this page periodically for updates.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg font-bold mb-3">7. Contact Us</h2>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            If you have any questions about these Terms and Conditions, please contact us at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 hover:underline">thakuradityasingh1512@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default TermsAndConditions;
