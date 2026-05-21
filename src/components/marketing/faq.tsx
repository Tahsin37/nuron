"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "1",
    title: "How does Nuron AI work?",
    content:
      "You sign up, add your products, and connect your Telegram or Messenger bot. When a customer messages your bot, our AI reads your product catalog and replies instantly — with the right price, stock info, and delivery details. Like hiring a 24/7 sales employee that never sleeps.",
  },
  {
    id: "2",
    title: "Do I need any technical skills to set it up?",
    content:
      "Not at all. The setup takes under 5 minutes: create a Telegram bot via @BotFather, paste the token in your dashboard, add your products, and you're live. No coding, no APIs, no servers to manage.",
  },
  {
    id: "3",
    title: "Which languages does the AI support?",
    content:
      "The AI automatically detects and replies in the customer's language. It supports English, Bangla (বাংলা), Banglish (Bangla in English letters), Hindi, and more. If a customer writes in Banglish, it replies in Banglish.",
  },
  {
    id: "4",
    title: "Can the AI understand product images?",
    content:
      "Yes! Customers can send a photo of a product and the AI will analyze the image, match it against your catalog, and suggest the closest product with its price and details.",
  },
  {
    id: "5",
    title: "How does the lead capture work?",
    content:
      "When a customer shows buying intent — asks for price, says 'order dite chai', or shares their phone number — the AI automatically flags them as a hot or warm lead in your dashboard. You'll never miss a ready-to-buy customer again.",
  },
  {
    id: "6",
    title: "Is it free to get started?",
    content:
      "Yes, the Starter plan is completely free with up to 100 AI replies per month. The AI runs on free-tier providers like Groq (no credit card needed). Upgrade anytime for unlimited replies and premium features.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-900/30 to-transparent pointer-events-none" />
      <div className="max-w-2xl mx-auto relative">
        <div className="text-center mb-12">
          <span className="text-xs font-medium tracking-widest text-zinc-500 uppercase">FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3 gradient-text">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground mt-3 text-sm max-w-lg mx-auto">
            Everything you need to know about Nuron AI. Can&apos;t find the answer? Reach out to our team.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-2" defaultValue="1">
          {faqs.map((item) => (
            <AccordionItem
              value={item.id}
              key={item.id}
              className="rounded-lg border border-border/50 bg-zinc-900/50 backdrop-blur px-4 py-1 data-[state=open]:border-zinc-700 transition-colors"
            >
              <AccordionTrigger className="justify-start gap-3 py-3 text-[15px] leading-6 hover:no-underline [&>svg]:-order-1 text-zinc-200">
                {item.title}
              </AccordionTrigger>
              <AccordionContent className="pb-3 ps-7 text-muted-foreground text-[13px] leading-relaxed">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
