"use client";

import {
  CheckCircle,
  Envelope,
  MapPin,
  Phone,
  WarningCircle,
} from "@phosphor-icons/react";
import { useState } from "react";
import { submitSupportInquiryAction } from "@/app/actions/support";
import { StoreShell } from "@/components/store/store-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const res = await submitSupportInquiryAction(formData);
    setLoading(false);

    if (res.success && res.ticketNumber) {
      setTicketNumber(res.ticketNumber);
    } else {
      setError(res.error || "Failed to submit inquiry. Please try again.");
    }
  };

  return (
    <StoreShell>
      <div className="mx-auto max-w-5xl px-6 py-12 md:py-20">
        <div className="border-b border-border pb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-success mb-2">
            Support & Inquiries
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">
            Contact Zencino
          </h1>
          <p className="mt-3 text-base text-muted-foreground max-w-xl">
            Have questions about product dimensions, care, or bulk orders? Send
            us a message and our team will get back to you promptly.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Envelope className="text-primary mt-1 shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-ui">
                    Email Us
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    support@zencino.com
                  </p>
                  <p className="text-2xs text-muted-foreground mt-0.5">
                    We respond within 24 business hours.
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-start gap-3">
                <Phone className="text-primary mt-1 shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-ui">
                    Customer Support
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    +91 98765 43210 (Mon–Fri, 10 AM – 6 PM IST)
                  </p>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-start gap-3">
                <MapPin className="text-primary mt-1 shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-ui">
                    Operations Center
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zencino Retail Solutions Pvt. Ltd.
                    <br />
                    Unit 402, Trade Link Hub, Lower Parel
                    <br />
                    Mumbai, Maharashtra 400013, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            {ticketNumber ? (
              <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
                <CheckCircle
                  className="mx-auto text-success"
                  size={48}
                  weight="fill"
                />
                <h3 className="text-xl font-bold text-foreground">
                  Message Received!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for reaching out to Zencino. Your inquiry has been
                  registered under ticket reference:
                </p>
                <div className="inline-block bg-background border border-border px-4 py-2 font-mono font-bold text-base text-foreground rounded-lg">
                  {ticketNumber}
                </div>
                <p className="text-xs text-muted-foreground">
                  Our customer care team will reply to your email within 24
                  business hours.
                </p>
                <Button
                  className="mt-2"
                  onClick={() => setTicketNumber(null)}
                  size="sm"
                  variant="secondary"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form
                className="border border-border bg-card p-8 space-y-4"
                onSubmit={handleSubmit}
              >
                <h3 className="text-base font-bold">Send us a message</h3>

                {error && (
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive rounded">
                    <WarningCircle className="shrink-0" size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="contact-your-name"
                    >
                      Your Name *
                    </label>
                    <Input
                      id="contact-your-name"
                      name="name"
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="contact-email-address"
                    >
                      Email Address *
                    </label>
                    <Input
                      id="contact-email-address"
                      name="email"
                      placeholder="you@example.com"
                      required
                      type="email"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="contact-phone-number-optional"
                    >
                      Phone Number (Optional)
                    </label>
                    <Input
                      id="contact-phone-number-optional"
                      name="phone"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                      htmlFor="contact-order-number-if-applicable"
                    >
                      Order Number (If applicable)
                    </label>
                    <Input
                      id="contact-order-number-if-applicable"
                      name="orderNumber"
                      placeholder="ZEN-YYYYMMDD-XXXX"
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="contact-subject-topic"
                  >
                    Subject / Topic *
                  </label>
                  <Input
                    id="contact-subject-topic"
                    name="subject"
                    placeholder="e.g. Question about acrylic pen holder dimensions"
                    required
                  />
                </div>

                <div>
                  <label
                    className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1"
                    htmlFor="contact-message"
                  >
                    Message *
                  </label>
                  <textarea
                    className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    id="contact-message"
                    name="body"
                    placeholder="How can we help you today?"
                    required
                    rows={5}
                  />
                </div>

                <Button
                  className="w-full py-5 font-semibold text-xs uppercase tracking-ui"
                  disabled={loading}
                  type="submit"
                >
                  {loading ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
