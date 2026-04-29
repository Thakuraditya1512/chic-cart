import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ReturnPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-10 sm:py-16 px-4">
      
      {/* Back Button (Sticky for mobile) */}
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
            Return Policy
          </h1>
          <p className="text-sm text-gray-500">
            Last updated: April 2026
          </p>
        </div>

        {/* Section Card */}
        <div className="space-y-6">

          {/* Section 1 */}
          <section className="bg-blue-50 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              1. Return Eligibility
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>
                Products must be unused, in original packaging, with proof of purchase.
              </li>
              <li>
                Return requests must be made within 7 days of delivery.
              </li>
              <li>
                Return shipping cost is borne by the customer unless the item is defective or damaged.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              2. Return Process
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              <li>
                Contact support at{" "}
                <a
                  href="mailto:thakuradityasingh1512@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  thakuradityasingh1512@gmail.com
                </a>{" "}
                with order details.
              </li>
              <li>
                After inspection, refunds are initiated within 7 days.
              </li>
              <li>
                Refunds are credited to your original payment method within 5 days.
              </li>
              <li>
                Total processing time is up to 15 days after product receipt.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="bg-blue-50 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              3. Non-Returnable Items
            </h2>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
              {/* <li>Gift cards and downloadable items are non-returnable.</li> */}
              <li>Final sale items cannot be returned.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="bg-white border border-gray-100 rounded-xl p-5 sm:p-6 hover:shadow-md transition">
            <h2 className="font-semibold text-lg text-blue-700 mb-3">
              4. Contact Us
            </h2>
            <p className="text-sm text-gray-600">
              Have questions? Reach out to us at{" "}
              <a
                href="mailto:thakuradityasingh1512@gmail.com"
                className="text-blue-600 hover:underline"
              >
                thakuradityasingh1512@gmail.com
              </a>
            </p>
          </section>

        </div>

        {/* Bottom CTA */}
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

export default ReturnPolicy;
