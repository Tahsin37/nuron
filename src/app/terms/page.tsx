"use client";
import React from "react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { motion } from "framer-motion";

export default function TermsOfServicePage() {
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
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: May 12, 2026</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-xl p-8 md:p-12 shadow-2xl shadow-black/40 prose prose-invert prose-zinc max-w-none"
          >
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Nuron AI platform, website, and services (collectively, the "Services"), 
              you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              Nuron AI provides a platform that allows businesses to create, train, and deploy artificial intelligence 
              agents for sales, support, and lead capture. You understand and agree that the Service is provided "AS-IS" 
              and that Nuron AI assumes no responsibility for the timeliness, deletion, mis-delivery, or failure to store 
              any user communications or personalization settings.
            </p>

            <h2>3. Account Registration</h2>
            <p>
              In consideration of your use of the Service, you agree to: (a) provide true, accurate, current and complete 
              information about yourself as prompted by the Service's registration form and (b) maintain and promptly update 
              the Registration Data to keep it true, accurate, current and complete.
            </p>

            <h2>4. AI Agent Behavior and Liability</h2>
            <p>
              While Nuron AI strives to provide accurate and helpful AI responses, artificial intelligence can occasionally 
              produce inaccurate, inappropriate, or unintended outputs ("hallucinations"). 
            </p>
            <ul>
              <li>You are entirely responsible for the content, instructions, and training data provided to your AI agents.</li>
              <li>You agree to monitor your agents' conversations and correct any behavioral issues.</li>
              <li>Nuron AI shall not be held liable for any damages, lost sales, or reputation harm resulting from statements made by your configured AI agents.</li>
            </ul>

            <h2>5. Acceptable Use Policy</h2>
            <p>
              You agree not to use the Service to:
            </p>
            <ul>
              <li>Create AI agents that impersonate a human without disclosing their AI nature where required by law.</li>
              <li>Upload or provide training data that contains malware, illegal content, or infringes on third-party intellectual property rights.</li>
              <li>Use the platform for spam, unsolicited advertising, or any unlawful purpose.</li>
              <li>Attempt to reverse engineer, decompile, or extract the source code of the software.</li>
            </ul>

            <h2>6. Intellectual Property</h2>
            <p>
              You retain all rights to the training data and custom instructions you provide. Nuron AI retains all rights, 
              title, and interest in and to the platform, including all associated intellectual property rights.
            </p>
            
            <h2>7. Termination</h2>
            <p>
              We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason 
              whatsoever, including without limitation if you breach the Terms.
            </p>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
