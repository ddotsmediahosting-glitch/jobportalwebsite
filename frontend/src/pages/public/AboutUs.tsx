import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Building2, MapPin, Target, Heart, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { SEOHead } from '../../components/SEOHead';

const STATS = [
  { icon: Briefcase, value: '10,000+', label: 'Active Job Listings', color: 'from-brand-500 to-brand-700' },
  { icon: Users,     value: '50,000+', label: 'Registered Job Seekers', color: 'from-violet-500 to-purple-700' },
  { icon: Building2, value: '2,000+',  label: 'Employer Partners',     color: 'from-emerald-500 to-teal-700' },
  { icon: MapPin,    value: '7',        label: 'Emirates Covered',      color: 'from-gold-400 to-orange-500' },
];

const VALUES = [
  {
    icon: Target,
    title: 'Our Mission',
    desc: 'To connect every job seeker in the UAE with the right opportunity — efficiently, transparently, and completely free of charge. We believe great careers start with great connections.',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    icon: Heart,
    title: 'People First',
    desc: 'Behind every CV is a person with ambitions, responsibilities, and dreams. We build our platform with empathy — for the nurse seeking stability, the engineer chasing growth, and the graduate taking their first step.',
    color: 'bg-rose-50 text-rose-600',
  },
  {
    icon: Shield,
    title: 'Verified & Trusted',
    desc: 'Every employer on DdotsmediaJobs is manually reviewed. We actively remove spam, duplicate, and fraudulent listings so your job search stays clean and efficient.',
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Zap,
    title: 'AI-Powered Edge',
    desc: 'From ATS CV scoring to AI interview coaching, we equip UAE job seekers with the same tools used by top global recruiters — so you walk into every opportunity fully prepared.',
    color: 'bg-violet-50 text-violet-600',
  },
];

const EMIRATES = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain',
];

const WHY_US = [
  'Free to apply — no hidden fees for job seekers',
  'Verified job listings from approved employers',
  'AI-powered CV analyser and interview coaching',
  'Jobs across all 7 UAE Emirates, updated daily',
  'Part-time, full-time, remote & visa-sponsored roles',
  'Dedicated Emiratization jobs for UAE nationals',
  'Seeker dashboard to track all your applications',
  'WhatsApp job alert groups for instant notifications',
];

export function AboutUs() {
  return (
    <>
      <SEOHead
        title="About DdotsmediaJobs | UAE's Leading Job Portal"
        description="DdotsmediaJobs is the UAE's trusted job portal connecting job seekers with verified employers across Dubai, Abu Dhabi, Sharjah and all seven Emirates. Free to apply."
        canonical="https://ddotsmediajobs.com/about"
        ogUrl="https://ddotsmediajobs.com/about"
      />

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <span className="inline-flex items-center gap-2 bg-white/15 border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Building2 size={14} /> About Us
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
            Connecting UAE Talent<br />with Great Opportunities
          </h1>
          <p className="text-lg text-brand-100/90 max-w-2xl mx-auto leading-relaxed">
            DdotsmediaJobs is the UAE's trusted job portal — built to make finding
            and filling jobs simpler, faster, and completely free for job seekers
            across all seven Emirates.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm"
            >
              Browse Jobs <ArrowRight size={14} />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all text-sm"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 text-center">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                <Icon size={22} className="text-white" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ── */}
      <section className="bg-gray-50 border-y border-gray-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-5">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            DdotsmediaJobs was founded with one clear goal: to make it easier for
            professionals in the UAE to find great work — and for great employers to
            find them. The UAE job market is fast-moving, diverse, and full of
            opportunity, yet job seekers often struggled to cut through the noise of
            outdated listings, unreliable platforms, and expensive recruitment gatekeepers.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We built DdotsmediaJobs to change that. Today, we serve tens of thousands
            of job seekers and thousands of employers across Dubai, Abu Dhabi, Sharjah,
            and every corner of the UAE — powered by AI tools that were once reserved
            only for large recruitment firms.
          </p>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What We Stand For</h2>
          <p className="text-gray-500 mt-2 text-sm">The principles that guide how we build and operate</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {VALUES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 flex gap-4">
              <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Why choose us ── */}
      <section className="bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Why Choose DdotsmediaJobs?</h2>
            <p className="text-brand-200/70 text-sm mt-2">Everything you need to succeed in your UAE job search</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {WHY_US.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Emirates coverage ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Covering All Seven Emirates</h2>
        <p className="text-gray-500 text-sm mb-8">Jobs updated daily across every emirate in the UAE</p>
        <div className="flex flex-wrap justify-center gap-3">
          {EMIRATES.map((emirate) => (
            <span
              key={emirate}
              className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 border border-brand-100 px-4 py-2 rounded-full text-sm font-medium"
            >
              🇦🇪 {emirate}
            </span>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-brand-600 py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Find Your Next Role?</h2>
          <p className="text-brand-100/80 text-sm mb-6">
            Join 50,000+ professionals already using DdotsmediaJobs to advance their careers in the UAE.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-8 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-sm"
            >
              Create Free Account <ArrowRight size={14} />
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-8 py-3 rounded-xl border border-white/20 transition-all text-sm"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
