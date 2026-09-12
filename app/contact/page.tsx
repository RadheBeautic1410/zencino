"use client";

import { useState } from "react";
import { CheckCircle, Envelope, MapPin, Phone } from "@phosphor-icons/react";
import { StoreShell } from "@/components/store/store-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
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
            Have questions about product dimensions, care, or bulk orders? Send us a message and our team will get back to you promptly.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-12">
          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="border border-border bg-card p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Envelope className="text-primary mt-1 shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-ui">Email Us</h3>
                  <p className="text-xs text-muted-foreground mt-1">support@zencino.com</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">We respond within 24 business hours.</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-start gap-3">
                <Phone className="text-primary mt-1 shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-ui">Customer Support</h3>
                  <p className="text-xs text-muted-foreground mt-1">+91 (Support hours: Mon–Fri, 10 AM – 6 PM IST)</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex items-start gap-3">
                <MapPin className="text-primary mt-1 shrink-0" size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-ui">Operations Center</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zencino Commerce<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            {submitted ? (
              <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center space-y-3">
                <CheckCircle className="mx-auto text-success" size={48} weight="fill" />
                <h3 className="text-xl font-bold text-foreground">Message Received!</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Thank you for reaching out to Zencino. We have received your inquiry and will follow up with you via email shortly.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="border border-border bg-card p-8 space-y-4">
                <h3 className="text-base font-bold">Send us a message</h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Your Name *
                    </label>
                    <Input required placeholder="Your full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                      Email Address *
                    </label>
                    <Input required type="email" placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Subject / Topic *
                  </label>
                  <Input required placeholder="e.g. Question about acrylic pen holder dimensions" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-ui text-muted-foreground mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="How can we help you today?"
                    className="w-full border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button type="submit" className="w-full py-5 font-semibold text-xs uppercase tracking-ui">
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </StoreShell>
  );
}
