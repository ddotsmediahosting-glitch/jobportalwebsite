import { Link } from 'react-router-dom';
import { SEOHead } from '../../components/SEOHead';
import {
  FileText, Briefcase, Users, Star, CheckCircle, ArrowRight,
  Mail, Zap, BookOpen, Video,
} from 'lucide-react';

const SERVICES = [
  {
    icon: FileText,
    color: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    title: 'CV & Resume Review',
    desc: 'Get expert feedback on your CV tailored for media, creative, and marketing roles in the UAE. We review structure, keywords, ATS compatibility, and impact.',
    features: ['ATS keyword optimization', 'Industry-specific formatting', 'UAE market alignment', 'Actionable written feedback'],
    cta: 'Request CV Review',
    to: '/contact?service=cv-review',
  },
  {
    icon: Zap,
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    title: 'Portfolio Review',
    desc: 'For designers, videographers, content creators, and creative professionals. Get feedback on how your portfolio lands with UAE media employers.',
    features: ['Creative portfolio critique', 'Platform-specific tips (Behance, Dribbble)', 'Presentation & storytelling advice', 'UAE agency perspective'],
    cta: 'Request Portfolio Review',
    to: '/contact?service=portfolio-review',
  },
  {
    icon: Video,
    color: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    title: 'Interview Preparation',
    desc: 'Practice for media & creative industry interviews. Role-specific questions, mock sessions, and coaching on presenting your creative work confidently.',
    features: ['Role-specific mock interviews', 'Common media industry questions', 'Portfolio walk-through coaching', 'Salary negotiation guidance'],
    cta: 'Book Interview Prep',
    to: '/contact?service=interview-prep',
  },
  {
    icon: BookOpen,
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: 'Career Direction Coaching',
    desc: 'Not sure what media or creative path to take? Get a 1:1 session to map your skills, explore opportunities, and build an action plan for your UAE career.',
    features: ['Skills & strengths mapping', 'Media industry career paths', 'Goal setting & timeline', 'Niche positioning strategy'],
    cta: 'Book a Session',
    to: '/contact?service=career-coaching',
  },
];

const PROCESS = [
  { step: '01', title: 'Submit Your Request', desc: 'Fill out the inquiry form and tell us about your goals and current situation.' },
  { step: '02', title: 'We Review & Confirm', desc: 'Our team reviews your submission and confirms availability within 24 hours.' },
  { step: '03', title: 'Service Delivery', desc: 'Receive your review, feedback, or coaching session — practical, actionable, and UAE-focused.' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah M.',
    role: 'Senior Graphic Designer, Dubai',
    text: 'After the portfolio review I completely restructured my Behance. Within 3 weeks I had 2 interviews at agencies I\'d been targeting for months.',
    stars: 5,
  },
  {
    name: 'James K.',
    role: 'Content Creator, Abu Dhabi',
    text: 'The CV review flagged ATS issues I had no idea about. My application response rate went from near zero to consistent callbacks.',
    stars: 5,
  },
  {
    name: 'Layla H.',
    role: 'Marketing Manager, Sharjah',
    text: 'The career coaching session helped me finally commit to making the move from agency to in-house. Best career decision I made.',
    stars: 5,
  },
];

export function CareerServices() {
  return (
    <div className="overflow-hidden">
      <SEOHead
        title="Career Services for Media & Creative Professionals | DdotsmediaJobs"
        description="CV review, portfolio critique, interview prep, and career coaching tailored for media, design, marketing, and creative professionals in the UAE."
        canonical="https://ddotsmediajobs.com/career-services"
      />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-gray-900 via-brand-950 to-gray-900 text-white overflow-hidden py-20 px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-brand-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Star size={13} className="fill-gold-400 text-gold-400" /> For Media & Creative Professionals
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
            Career Services Built for the{' '}
            <span className="text-gold-400">Creative Industry</span>
          </h1>
          <p className="text-lg text-brand-100/80 max-w-2xl mx-auto mb-8">
            CV reviews, portfolio critiques, interview coaching, and career direction sessions — all tailored for media, design, marketing, and content roles in the UAE.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact?service=general"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
            >
              Get Started <ArrowRight size={15} />
            </Link>
            <Link
              to="/cv-analyzer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all"
            >
              <Zap size={15} /> Try Free AI CV Check
            </Link>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full mb-3">
            <Briefcase size={11} /> What We Offer
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900">Choose Your Service</h2>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">Practical support from people who understand the UAE media and creative hiring landscape.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {SERVICES.map(({ icon: Icon, color, bg, iconColor, title, desc, features, cta, to }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 flex flex-col">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 shadow-md`}>
                <Icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5 mb-6 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to={to}
                className={`inline-flex items-center justify-center gap-2 ${bg} ${iconColor} font-semibold text-sm px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity`}
              >
                {cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-2">Simple, fast, and focused on results.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {PROCESS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="h-12 w-12 rounded-full bg-brand-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4 shadow-md">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-extrabold text-gray-900">What Professionals Say</h2>
          <p className="text-gray-500 mt-2">Real results from media and creative professionals in the UAE.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ name, role, text, stars }) => (
            <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {[...Array(stars)].map((_, i) => (
                  <Star key={i} size={14} className="fill-gold-400 text-gold-400" />
                ))}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">"{text}"</p>
              <div>
                <div className="font-semibold text-sm text-gray-900">{name}</div>
                <div className="text-xs text-gray-500">{role}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">* Testimonials are illustrative — seed content, replace with real reviews.</p>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-brand-700 to-brand-500 py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Ready to Accelerate Your Career?</h2>
          <p className="text-brand-100/80 mb-6">Submit an inquiry today and hear back within 24 hours.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-brand-700 font-bold px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-lg"
            >
              <Mail size={15} /> Contact Us
            </Link>
            <Link
              to="/jobs"
              className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 transition-all"
            >
              <Users size={15} /> Browse Jobs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
