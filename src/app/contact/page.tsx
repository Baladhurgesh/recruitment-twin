'use client';

import Link from "next/link";
import { useState, FormEvent } from "react";

type FormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit');
      }
      
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="gradient-bg min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            <span className="text-blue-400">B</span>ala
          </Link>
          <Link 
            href="/" 
            className="px-4 py-2 rounded-full text-sm font-medium text-slate-300 
                       hover:text-white hover:bg-slate-800/50 transition-all duration-200
                       flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Twin
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              <span className="text-slate-100">Get in </span>
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-slate-400">
              Want to connect? Drop me a message and I&apos;ll get back to you soon.
            </p>
          </div>

          {/* Success Message */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/50 text-emerald-300 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Message sent successfully!</span>
              </div>
              <p className="text-sm text-emerald-400/80">I&apos;ll get back to you as soon as possible.</p>
            </div>
          )}

          {/* Error Message */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-800/50 text-red-300 text-center">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Something went wrong. Please try again.</span>
              </div>
            </div>
          )}

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 sm:p-8 space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={handleChange('name')}
                className={`
                  w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-slate-100
                  placeholder:text-slate-500 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  ${errors.name ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}
                `}
                placeholder="Your name"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange('email')}
                className={`
                  w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-slate-100
                  placeholder:text-slate-500 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  ${errors.email ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}
                `}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Phone <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                className={`
                  w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-slate-100
                  placeholder:text-slate-500 transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  ${errors.phone ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}
                `}
                placeholder="+1 (555) 000-0000"
              />
              {errors.phone && (
                <p className="mt-2 text-sm text-red-400">{errors.phone}</p>
              )}
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={handleChange('message')}
                rows={5}
                className={`
                  w-full px-4 py-3 rounded-xl bg-slate-900/50 border text-slate-100
                  placeholder:text-slate-500 transition-all duration-200 resize-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
                  ${errors.message ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'}
                `}
                placeholder="What would you like to discuss?"
              />
              {errors.message && (
                <p className="mt-2 text-sm text-red-400">{errors.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-3 px-6 rounded-xl font-medium transition-all duration-200
                bg-gradient-to-r from-blue-500 to-violet-500 text-white
                hover:from-blue-400 hover:to-violet-400 hover:shadow-lg hover:shadow-blue-500/25
                focus:outline-none focus:ring-2 focus:ring-blue-500/50
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                flex items-center justify-center gap-2
              `}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send Message
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Alternative Contact */}
          <p className="text-center text-slate-500 text-sm mt-8">
            Or talk to my{' '}
            <Link href="/" className="text-blue-400 hover:text-blue-300 link-underline">
              digital twin
            </Link>
            {' '}for instant responses.
          </p>
        </div>
      </main>
    </div>
  );
}

