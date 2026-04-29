import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const Returns = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.returns-animate',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      icon: RefreshCw,
      title: 'Initiate Return',
      description:
        'Customers must initiate a return request within 7 days of delivery through the "My Orders" section or by contacting our support team with order details.',
    },
    {
      icon: CheckCircle,
      title: 'Approval & Verification',
      description:
        'All return requests are reviewed based on eligibility criteria. Approval is granted only if the product meets the required conditions.',
    },
    {
      icon: Clock,
      title: 'Pickup / Return Shipment',
      description:
        'Once approved, the item will either be picked up by our courier partner or must be shipped back to our warehouse as instructed.',
    },
    {
      icon: XCircle,
      title: 'Refund Credited',
      description:
        'After successful inspection, the refund is processed and credited to the original payment method within the specified timeline.',
    },
  ];

  const conditions = [
    'Products must be unused, unworn, unwashed, and in original condition',
    'All tags, labels, invoices, and original packaging must be intact',
    'Return requests must be raised within 7 days of delivery',
    'Products damaged due to misuse, negligence, or improper handling are not eligible',
    'Customized, personalized, or made-to-order products are not eligible for return',
  ];

  return (
    <>
      <div ref={containerRef} className="min-h-screen bg-background pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

          {/* Back */}
          <Link
            to="/"
            className="returns-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition text-sm mb-6"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          {/* Header */}
          <div className="returns-animate text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Returns, Refunds & Exchanges Policy
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              This Returns, Refunds, and Exchanges Policy is issued in accordance with the Consumer Protection Act, 2019 and other applicable Indian laws. By placing an order on our platform, you acknowledge and agree to the terms and conditions set forth below. For any return or refund request, please contact our legal returns desk at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 underline">thakuradityasingh1512@gmail.com</a>.
            </p>
          </div>

          {/* Legal Steps */}
          <div className="returns-animate grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {steps.map((step, index) => (
              <div key={index} className="bg-foreground/5 rounded-2xl p-5 text-center border border-border">
                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6 text-foreground/70" />
                </div>
                <h3 className="text-sm font-bold mb-2">
                  {index + 1}. {step.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Legal Return Conditions */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 mb-8 border border-border">
            <h2 className="text-lg font-bold mb-4">Return Eligibility & Legal Conditions</h2>
            <ul className="space-y-3">
              {conditions.map((c, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-green-500 mt-0.5" />
                  <span className="text-sm text-muted-foreground">{c}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              All returns are subject to inspection and approval as per the Consumer Protection (E-Commerce) Rules, 2020. Non-compliance with the above conditions may result in rejection of the return request.
            </p>
          </div>

          {/* Refund Policy - Legal */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 mb-8 border border-border">
            <h2 className="text-lg font-bold mb-3">Refund Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Once the returned product is received at our warehouse and passes inspection, you will be notified of the approval or rejection of your refund request. If approved, the refund will be processed and credited to your original payment method <strong>within 5 business days</strong> of approval, in accordance with the Reserve Bank of India (RBI) guidelines. The total refund cycle, including bank processing, may take up to <strong>15 business days</strong>.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For any refund-related queries, please write to <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 underline">thakuradityasingh1512@gmail.com</a> with your order details.
            </p>
          </div>

          {/* Exchange Policy - Legal */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 mb-8 border border-border">
            <h2 className="text-lg font-bold mb-3">Exchange Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We offer exchanges for eligible products in case of size issues, defects, or incorrect items delivered. Exchange requests must be raised within 7 days of delivery and are subject to product availability and inspection. Approved exchanges will be processed, and the replacement product will be delivered within <strong>3–7 business days</strong> as per applicable law.
            </p>
          </div>

          {/* Order Cancellation Policy - Legal */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 mb-8 border border-border">
            <h2 className="text-lg font-bold mb-3">Order Cancellation Policy</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Orders can be cancelled only before they are dispatched from our warehouse. Once an order has been shipped, it cannot be cancelled. However, customers may initiate a return request after delivery as per this policy and in compliance with the Consumer Protection (E-Commerce) Rules, 2020.
            </p>
          </div>

          {/* Non-Refundable Items - Legal */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 mb-8 border border-border">
            <h2 className="text-lg font-bold mb-3">Non-Refundable Items</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              {/* <li>• Gift cards and digital/downloadable products</li> */}
              <li>• Final sale or clearance items</li>
              <li>• Used or damaged items not caused by us</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              These exclusions are in accordance with Section 16 of the Consumer Protection Act, 2019.
            </p>
          </div>

          {/* Shipping & Return Charges - Legal */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 mb-8 border border-border">
            <h2 className="text-lg font-bold mb-3">Shipping & Return Charges</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Return shipping charges may be applicable and are to be borne by the customer unless the return is due to a defective, damaged, or incorrect product delivered by us. All charges and refunds will be processed in accordance with applicable law.
            </p>
          </div>

          {/* Contact & Legal Support */}
          <div className="returns-animate bg-foreground/5 rounded-2xl p-6 border border-border">
            <h2 className="text-lg font-bold mb-3">Contact & Legal Support</h2>
            <p className="text-sm text-muted-foreground">
              For any questions, disputes, or assistance regarding returns, refunds, or legal compliance, please contact our legal returns desk at <a href="mailto:thakuradityasingh1512@gmail.com" className="text-blue-600 underline">thakuradityasingh1512@gmail.com</a>.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              All requests will be handled in accordance with applicable Indian law and consumer rights.
            </p>
          </div>

        </div>
      </div>
      <Footer />
    </>
  );
};

export default Returns;
