import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, MessageSquare, Send, Clock, ChevronRight } from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';
import toast from 'react-hot-toast';

const FAQS = [
  { q: 'How do I post a job?', to: '/register', cta: 'Register as employer' },
  { q: 'Is it free to apply for jobs?', to: '/jobs', cta: 'Browse free jobs' },
  { q: 'How do I report a fake listing?', to: '/jobs', cta: 'View guidelines' },
  { q: 'How do I delete my account?', to: '/profile', cta: 'Manage account' },
];

export function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    // Simulate submit — replace with real API call when backend endpoint is ready
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setSubmitting(false);
  };

  return (
    <>
      <SEOHead
        title="Contact Us | DdotsmediaJobs UAE"
        description="Get in touch with the DdotsmediaJobs team. We're here to help job seekers and employers across the UAE. Contact us for support, partnerships, or general enquiries."
        canonical="https://ddotsmediajobs.com/contact"
        ogUrl="https://ddotsmediajobs.com/contact"
      />

      {/* ── Header ── */}
      <section className="bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-5">
            <MessageSquare size={13} /> Get in Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">Contact DdotsmediaJobs</h1>
          <p className="text-brand-200/80 text-sm leading-relaxed max-w-xl mx-auto">
            Have a question, a partnership enquiry, or need support? We're here to help.
            Fill out the form below or reach us directly — we typically respond within 24 hours.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── Contact info sidebar ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 space-y-5">
              <h2 className="font-semibold text-gray-900 text-sm">Contact Information</h2>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Mail size={15} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <a href="mailto:support@ddotsmediajobs.com" className="text-sm text-brand-600 hover:underline font-medium">
                    support@ddotsmediajobs.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={15} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-sm text-gray-700 font-medium">Dubai, UAE</p>
                  <p className="text-xs text-gray-400">United Arab Emirates</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Clock size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Response Time</p>
                  <p className="text-sm text-gray-700 font-medium">Within 24 hours</p>
                  <p className="text-xs text-gray-400">Sunday – Thursday</p>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6">
              <h2 className="font-semibold text-gray-900 text-sm mb-4">Common Queries</h2>
              <ul className="space-y-2">
                {FAQS.map(({ q, to, cta }) => (
                  <li key={q}>
                    <p className="text-xs text-gray-600 mb-0.5">{q}</p>
                    <Link to={to} className="text-xs text-brand-600 hover:underline inline-flex items-center gap-1 font-medium">
                      {cta} <ChevronRight size={10} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* For employers */}
            <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
              <h3 className="font-semibold text-brand-900 text-sm mb-1">For Employers</h3>
              <p className="text-xs text-brand-700 mb-3 leading-relaxed">
                Want to post jobs or discuss partnership opportunities? Reach out directly.
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-white border border-brand-200 px-4 py-2 rounded-lg hover:bg-brand-100 transition-colors"
              >
                Post a Job Free <ChevronRight size={11} />
              </Link>
            </div>
          </div>

          {/* ── Contact form ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-8">
              <h2 className="font-bold text-gray-900 text-lg mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Your name"
                      className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder-gray-400 hover:border-gray-300 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder-gray-400 hover:border-gray-300 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-white hover:border-gray-300 transition-all"
                  >
                    <option value="">Select a subject…</option>
                    <option value="Job Seeker Support">Job Seeker Support</option>
                    <option value="Employer / Hiring">Employer / Hiring Enquiry</option>
                    <option value="Report a Listing">Report a Fraudulent Listing</option>
                    <option value="Technical Issue">Technical Issue</option>
                    <option value="Partnership">Partnership / Advertising</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us how we can help you…"
                    className="block w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder-gray-400 hover:border-gray-300 transition-all resize-y"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold px-8 py-3 rounded-xl hover:from-brand-700 hover:to-brand-600 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
