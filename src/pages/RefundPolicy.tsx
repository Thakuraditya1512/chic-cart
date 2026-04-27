import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-10 sm:py-16 px-4">

      {/* Back Button */}
      <div className="max-w-4xl mx-auto mb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
        >
          <ArrowLeft size={18} />
          Back to Home
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 sm:p-10 border border-blue-100">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Refund Policy
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: April 2026
          </p>
        </div>

        <div className="space-y-6">

          {/* 1. Eligibility */}
          <section className="bg-blue-50 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              1. Eligibility for Refunds
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>Products must be unused, in original packaging, and in resellable condition.</li>
              <li>Refund requests must be initiated within <strong>7 days</strong> of delivery.</li>
              <li>Proof of purchase (order ID or invoice) is mandatory.</li>
              <li>Refunds apply to defective, damaged, incorrect, or unsatisfactory items.</li>
            </ul>
          </section>

          {/* 2. Refund Process */}
          <section className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              2. Refund Process
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>
                Email us at{" "}
                <a
                  href="mailto:thakuradityasingh1512@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  thakuradityasingh1512@gmail.com
                </a>{" "}
                with your order details and issue.
              </li>
              <li>After inspection, refunds are approved within 7 days.</li>
              <li>Refunds are processed and credited within 5–7 business days after we receive the returned item.</li>
              <li>The amount is credited back to your original payment method.</li>
              <li>Total refund cycle may take up to <strong>15 days</strong>.</li>
            </ul>
          </section>

          {/* 3. Exchange */}
          <section className="bg-blue-50 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              3. Exchange Policy
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>Exchanges are available for size, defect, or incorrect product.</li>
              <li>Exchanged products will be delivered within 3–7 days after approval.</li>
              <li>Exchange is subject to stock availability.</li>
            </ul>
          </section>

          {/* 4. Cancellation */}
          <section className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              4. Order Cancellation
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>Orders can be cancelled before they are shipped.</li>
              <li>Once shipped, cancellation is not possible but return/refund can be requested.</li>
            </ul>
          </section>

          {/* 5. Non Refundable */}
          <section className="bg-blue-50 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              5. Non-Refundable Items
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>Gift cards and digital/downloadable products.</li>
              <li>Items marked as final sale.</li>
              <li>Used or damaged items not due to our fault.</li>
            </ul>
          </section>

          {/* 6. Late Refund */}
          <section className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              6. Late or Missing Refunds
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>Check your bank account first.</li>
              <li>Contact your bank or card provider (processing delays may occur).</li>
              <li>If still unresolved, contact us via email.</li>
            </ul>
          </section>

          {/* 7. Contact */}
          <section className="bg-blue-50 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              7. Contact Us
            </h2>
            <p className="text-sm text-gray-600">
              For any queries, reach us at{" "}
              <a
                href="mailto:thakuradityasingh1512@gmail.com"
                className="text-blue-600 hover:underline"
              >
                thakuradityasingh1512@gmail.com
              </a>
            </p>
          </section>

        </div>

        {/* Bottom Button */}
        <div className="mt-10 text-center">
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition shadow-md"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
