'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How long does setup take?',
    answer:
      'About 5 minutes. You create an account, copy a single script tag, paste it into your app, and you\'re done. No build steps, no configuration files, no complex setup.',
  },
  {
    question: 'Does it slow down my site?',
    answer:
      'No. The widget script loads asynchronously and is only 12KB gzipped. It won\'t block your page load or affect your Core Web Vitals. We obsess over performance.',
  },
  {
    question: 'What\'s included in the free tier?',
    answer:
      '50 feedback submissions per month, 1 project, screenshot capture, and access to the basic dashboard. Perfect for side projects or testing Zapbolt before upgrading.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes, absolutely. No contracts, no cancellation fees. You can upgrade, downgrade, or cancel at any time from your account settings. Your data remains available for 30 days after cancellation.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We use enterprise-grade security including TLS encryption in transit, AES-256 encryption at rest, and SOC 2 Type II compliant infrastructure. Your feedback data is yours - we never sell or share it.',
  },
  {
    question: 'Can I customize the widget appearance?',
    answer:
      'Yes, on Pro and Business plans. You can customize the widget color, position, trigger button, and even add your own branding. On Business plans, you can completely white-label the widget.',
  },
  {
    question: 'Do you offer a self-hosted option?',
    answer:
      'Not currently, but it\'s on our roadmap. Contact us if you have specific self-hosting requirements and we\'ll let you know when it\'s available.',
  },
  {
    question: 'What integrations do you support?',
    answer:
      'Currently, we support Slack, Discord, and webhooks on Pro plans. We\'re adding Jira, Linear, GitHub Issues, and Notion soon. Business plans get API access for custom integrations.',
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="scroll-mt-16 py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
            FAQ
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about Zapbolt. Can&apos;t find what you&apos;re looking for?{' '}
            <a href="/contact" className="text-indigo-600 hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
