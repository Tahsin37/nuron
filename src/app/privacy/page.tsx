"use client";
import React from "react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 relative py-24 px-6">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_10%,rgba(255,255,255,0.03),transparent_60%)]" />
        
        <div className="mx-auto max-w-4xl relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: May 12, 2026</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-black/40 prose prose-invert prose-zinc max-w-none"
          >
            <h2>1. Introduction</h2>
            <p>
              Welcome to Nuron AI. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our 
              website and use our AI agent platform (regardless of where you visit it from) and tell you about 
              your privacy rights and how the law protects you.
            </p>

            <h2>2. The Data We Collect</h2>
            <p>
              We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul>
              <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data</strong> includes billing address, email address and telephone numbers.</li>
              <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, and other technology on the devices you use to access this website.</li>
              <li><strong>Conversation Data</strong> includes the transcripts of interactions between your users and the AI agents deployed via our platform, which may contain information your users choose to share.</li>
            </ul>

            <h2>3. How We Use Your Data</h2>
            <p>
              We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
            </p>
            <ul>
              <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
              <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
              <li>To improve our AI models and the quality of the service provided by our agents.</li>
              <li>Where we need to comply with a legal obligation.</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
            </p>

            <h2>5. AI Training and Data Processing</h2>
            <p>
              When you train your Nuron AI agents using URLs, PDFs, or other text documents, that data is processed solely for the purpose of enabling your specific agent to respond accurately. We do not use your proprietary training data to train our foundational models across different customers unless explicitly opted-in.
            </p>

            <h2>6. Your Legal Rights</h2>
            <p>
              Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to request access, correction, erasure, restriction, transfer, to object to processing, to portability of data and (where the lawful ground of processing is consent) to withdraw consent.
            </p>
            
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at privacy@nuronai.com.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
