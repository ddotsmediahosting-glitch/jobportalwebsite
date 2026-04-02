import React, { useState, useRef, KeyboardEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import {
  User, Briefcase, GraduationCap, Star, Plus, Trash2,
  Wand2, Loader2, ChevronRight, ChevronLeft, Copy, Download,
  Lightbulb, FileText, X, Eye, EyeOff, Edit3, Check,
  Mail, Phone, MapPin, Linkedin, Award, RefreshCw,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface PersonalInfo {
  firstName: string; lastName: string;
  email: string; phone: string;
  location: string; linkedIn: string;
  nationality?: string;
}
interface Experience {
  company: string; title: string;
  startDate: string; endDate: string;
  current: boolean; description: string;
}
interface Education {
  institution: string; degree: string;
  field: string; endDate: string;
}
interface Certification {
  name: string; issuer: string; year: string;
}
interface BuilderFormData {
  personalInfo: PersonalInfo;
  targetRole: string;
  yearsOfExperience: number;
  jobDescription: string;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
}
interface GeneratedCV {
  professionalSummary: string;
  enhancedExperience: Array<{ company: string; title: string; bulletPoints: string[] }>;
  suggestedSkills: string[];
  atsKeywords: string[];
}

// ── TagsInput component ──────────────────────────────────────────────────────
function TagsInput({ tags, onAdd, onRemove, placeholder }: {
  tags: string[]; onAdd: (t: string) => void;
  onRemove: (t: string) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const val = input.trim().replace(/,+$/, '');
      if (val && !tags.includes(val)) onAdd(val);
      setInput('');
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onRemove(tags[tags.length - 1]);
    }
  };
  return (
    <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl min-h-12 focus-within:ring-2 focus-within:ring-purple-400 focus-within:border-transparent transition-all">
      {tags.map(tag => (
        <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 text-sm rounded-full border border-purple-200">
          {tag}
          <button type="button" onClick={() => onRemove(tag)} className="hover:text-red-500 transition-colors ml-0.5">
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
        placeholder={tags.length ? '' : placeholder}
        className="flex-1 min-w-28 outline-none text-sm bg-transparent text-gray-700 placeholder:text-gray-400"
      />
    </div>
  );
}

// ── CV Preview component ──────────────────────────────────────────────────────
function CVPreview({ data, generated, skills }: {
  data: BuilderFormData; generated: GeneratedCV | null; skills: string[];
}) {
  const pi = data.personalInfo;
  const hasName = pi.firstName || pi.lastName;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-[11px] leading-relaxed">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-5 py-4">
        <h1 className="text-base font-extrabold tracking-wide">
          {hasName ? `${pi.firstName} ${pi.lastName}` : 'Your Name'}
        </h1>
        {data.targetRole && <p className="text-purple-200 text-xs mt-0.5">{data.targetRole}</p>}
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-purple-100">
          {pi.email && <span className="flex items-center gap-1"><Mail size={9} />{pi.email}</span>}
          {pi.phone && <span className="flex items-center gap-1"><Phone size={9} />{pi.phone}</span>}
          {pi.location && <span className="flex items-center gap-1"><MapPin size={9} />{pi.location}</span>}
          {pi.linkedIn && <span className="flex items-center gap-1"><Linkedin size={9} />{pi.linkedIn}</span>}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Summary */}
        {generated?.professionalSummary ? (
          <div>
            <p className="font-bold text-purple-700 border-b border-purple-200 pb-0.5 mb-1.5 uppercase tracking-wider text-[9px]">Professional Summary</p>
            <p className="text-gray-700">{generated.professionalSummary}</p>
          </div>
        ) : (
          <div className="h-10 bg-gray-50 rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-300">
            Summary will appear here
          </div>
        )}

        {/* Experience */}
        {data.experience.some(e => e.company || e.title) && (
          <div>
            <p className="font-bold text-purple-700 border-b border-purple-200 pb-0.5 mb-1.5 uppercase tracking-wider text-[9px]">Work Experience</p>
            {data.experience.filter(e => e.company || e.title).map((exp, i) => {
              const gen = generated?.enhancedExperience?.[i];
              return (
                <div key={i} className="mb-2">
                  <p className="font-bold text-gray-800">{exp.title || 'Job Title'} — {exp.company || 'Company'}</p>
                  <p className="text-gray-400 text-[10px]">{exp.startDate}{exp.startDate ? ' – ' : ''}{exp.current ? 'Present' : exp.endDate}</p>
                  {gen?.bulletPoints ? (
                    <ul className="mt-1 space-y-0.5">
                      {gen.bulletPoints.slice(0, 3).map((bp, j) => <li key={j} className="text-gray-600">• {bp}</li>)}
                    </ul>
                  ) : exp.description ? (
                    <p className="text-gray-600 mt-0.5">{exp.description.slice(0, 120)}{exp.description.length > 120 ? '...' : ''}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}

        {/* Education */}
        {data.education.some(e => e.institution || e.degree) && (
          <div>
            <p className="font-bold text-purple-700 border-b border-purple-200 pb-0.5 mb-1.5 uppercase tracking-wider text-[9px]">Education</p>
            {data.education.filter(e => e.institution || e.degree).map((edu, i) => (
              <div key={i} className="mb-1">
                <p className="font-bold text-gray-800">{edu.degree}{edu.field ? ` in ${edu.field}` : ''}</p>
                <p className="text-gray-500">{edu.institution}{edu.endDate ? ` • ${edu.endDate}` : ''}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {(skills.length > 0 || (generated?.suggestedSkills?.length ?? 0) > 0) && (
          <div>
            <p className="font-bold text-purple-700 border-b border-purple-200 pb-0.5 mb-1.5 uppercase tracking-wider text-[9px]">Skills</p>
            <div className="flex flex-wrap gap-1">
              {[...new Set([...skills, ...(generated?.suggestedSkills || [])])].slice(0, 14).map(s => (
                <span key={s} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications?.some(c => c.name) && (
          <div>
            <p className="font-bold text-purple-700 border-b border-purple-200 pb-0.5 mb-1.5 uppercase tracking-wider text-[9px]">Certifications</p>
            {data.certifications.filter(c => c.name).map((cert, i) => (
              <p key={i} className="text-gray-700">• {cert.name}{cert.issuer ? ` — ${cert.issuer}` : ''}{cert.year ? ` (${cert.year})` : ''}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: 'Personal', icon: <User size={15} /> },
  { id: 1, label: 'Experience', icon: <Briefcase size={15} /> },
  { id: 2, label: 'Education', icon: <GraduationCap size={15} /> },
  { id: 3, label: 'Skills', icon: <Star size={15} /> },
  { id: 4, label: 'Generate', icon: <Wand2 size={15} /> },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export function CVBuilder() {
  const [step, setStep] = useState(0);
  const [generatedCV, setGeneratedCV] = useState<GeneratedCV | null>(null);
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  // Editable generated fields
  const [editedSummary, setEditedSummary] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [editedBullets, setEditedBullets] = useState<Record<number, string[]>>({});
  const [editingBulletIdx, setEditingBulletIdx] = useState<{ exp: number; bullet: number } | null>(null);
  const [editingBulletText, setEditingBulletText] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<BuilderFormData>({
    defaultValues: {
      personalInfo: { firstName: '', lastName: '', email: '', phone: '', location: '', linkedIn: '', nationality: '' },
      targetRole: '', yearsOfExperience: 0, jobDescription: '',
      experience: [{ company: '', title: '', startDate: '', endDate: '', current: false, description: '' }],
      education: [{ institution: '', degree: '', field: '', endDate: '' }],
      certifications: [{ name: '', issuer: '', year: '' }],
    },
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: 'certifications' });

  const formData = watch();

  const generateMutation = useMutation({
    mutationFn: async (data: BuilderFormData) => {
      const { data: res } = await api.post('/cv/generate', {
        personalInfo: data.personalInfo,
        targetRole: data.targetRole,
        yearsOfExperience: Number(data.yearsOfExperience),
        skills: skillTags,
        experience: data.experience,
        education: data.education,
        jobDescription: data.jobDescription || undefined,
      });
      return res.data as GeneratedCV;
    },
    onSuccess: (data) => {
      setGeneratedCV(data);
      setEditedSummary(data.professionalSummary);
      setEditedBullets(Object.fromEntries(data.enhancedExperience.map((e, i) => [i, [...e.bulletPoints]])));
      toast.success('CV generated! Review and edit as needed.');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const optimizeSummaryMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/cv/optimize', {
        section: 'summary',
        content: editedSummary,
        jobDescription: formData.jobDescription || 'General professional role',
      });
      return data.data.optimizedSummary as string;
    },
    onSuccess: (s) => { setEditedSummary(s); toast.success('Summary optimized!'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: BuilderFormData) => {
    if (!skillTags.length) { toast.error('Add at least one skill'); return; }
    if (!data.targetRole.trim()) { toast.error('Target role is required'); return; }
    generateMutation.mutate(data);
    setStep(4);
  };

  const effectiveSummary = editedSummary || generatedCV?.professionalSummary || '';
  const effectiveBullets = (i: number) => editedBullets[i] || generatedCV?.enhancedExperience?.[i]?.bulletPoints || [];

  // ── PDF Export ──────────────────────────────────────────────────────────────
  const downloadPDF = (data: BuilderFormData) => {
    const gen = generatedCV;
    if (!gen) return;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pi = data.personalInfo;
    const pageW = 210;
    const margin = 18;
    const usableW = pageW - margin * 2;
    let y = 0;

    // Header bar
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, pageW, 36, 'F');
    doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor('#ffffff');
    doc.text(`${pi.firstName} ${pi.lastName}`, margin, 14);
    if (data.targetRole) {
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor('#e9d5ff');
      doc.text(data.targetRole, margin, 21);
    }
    const contacts = [pi.email, pi.phone, pi.location].filter(Boolean).join('  •  ');
    if (contacts) {
      doc.setFontSize(8.5); doc.setTextColor('#d8b4fe');
      doc.text(contacts, margin, 28);
    }
    if (pi.linkedIn) {
      doc.setFontSize(8); doc.setTextColor('#c4b5fd');
      doc.text(pi.linkedIn, margin, 33);
    }
    y = 44;

    const addSection = (title: string) => {
      y += 3;
      if (y > 270) { doc.addPage(); y = 16; }
      doc.setFillColor(245, 243, 255);
      doc.rect(margin - 2, y - 4, usableW + 4, 7, 'F');
      doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor('#6d28d9');
      doc.text(title.toUpperCase(), margin, y);
      y += 5;
      doc.setTextColor('#1a1a1a');
    };

    const addText = (text: string, size = 10, bold = false, color = '#1a1a1a', indent = margin) => {
      doc.setFontSize(size); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, usableW - (indent - margin)) as string[];
      lines.forEach((line: string) => {
        if (y > 278) { doc.addPage(); y = 16; }
        doc.text(line, indent, y);
        y += size * 0.43;
      });
    };

    // Summary
    addSection('Professional Summary');
    addText(effectiveSummary, 10);

    // Experience
    addSection('Work Experience');
    gen.enhancedExperience.forEach((exp, i) => {
      addText(`${exp.title} — ${exp.company}`, 10, true);
      effectiveBullets(i).forEach(bp => { addText(`• ${bp}`, 9.5, false, '#333333', margin + 3); });
      y += 2;
    });

    // Education
    addSection('Education');
    data.education.forEach(edu => {
      const line = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.institution}${edu.endDate ? `  (${edu.endDate})` : ''}`;
      addText(line, 10);
    });

    // Skills
    addSection('Skills');
    const allSkills = [...new Set([...skillTags, ...gen.suggestedSkills])];
    addText(allSkills.join('  •  '), 10);

    // Certifications
    const certs = data.certifications.filter(c => c.name);
    if (certs.length) {
      addSection('Certifications');
      certs.forEach(c => addText(`• ${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}`, 10));
    }

    // ATS Keywords
    if (gen.atsKeywords.length) {
      addSection('Keywords');
      addText(gen.atsKeywords.join('  •  '), 9, false, '#555555');
    }

    // Page numbers
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor('#999999');
      doc.text(`${i} / ${pageCount}`, pageW - margin, 290, { align: 'right' });
    }

    doc.save(`${pi.firstName || 'My'}_${pi.lastName || 'CV'}_CV.pdf`);
    toast.success('PDF downloaded!');
  };

  const buildCVText = () => {
    const gen = generatedCV; if (!gen) return '';
    const pi = formData.personalInfo;
    const lines: string[] = [];
    lines.push(`${pi.firstName} ${pi.lastName}`.trim());
    lines.push([pi.email, pi.phone, pi.location].filter(Boolean).join(' | '));
    if (pi.linkedIn) lines.push(pi.linkedIn);
    lines.push('');
    lines.push('PROFESSIONAL SUMMARY'); lines.push('─'.repeat(50));
    lines.push(effectiveSummary); lines.push('');
    lines.push('WORK EXPERIENCE'); lines.push('─'.repeat(50));
    gen.enhancedExperience.forEach((exp, i) => {
      lines.push(`${exp.title} | ${exp.company}`);
      effectiveBullets(i).forEach(bp => lines.push(`• ${bp}`));
      lines.push('');
    });
    lines.push('EDUCATION'); lines.push('─'.repeat(50));
    formData.education.forEach(edu => lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.institution}${edu.endDate ? ` (${edu.endDate})` : ''}`));
    lines.push('');
    lines.push('SKILLS'); lines.push('─'.repeat(50));
    lines.push([...new Set([...skillTags, ...gen.suggestedSkills])].join(' • '));
    const certs = formData.certifications?.filter(c => c.name);
    if (certs?.length) {
      lines.push(''); lines.push('CERTIFICATIONS'); lines.push('─'.repeat(50));
      certs.forEach(c => lines.push(`• ${c.name}${c.issuer ? ` — ${c.issuer}` : ''}${c.year ? ` (${c.year})` : ''}`));
    }
    return lines.join('\n');
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-700 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
            <Wand2 size={14} className="text-yellow-400" /> AI-Powered CV Builder
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3">Build an ATS-Optimized CV</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Fill in your details — Claude AI crafts your professional summary, enhances your bullet points, and optimizes keywords to beat ATS filters.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center bg-white rounded-2xl shadow-sm p-3 mb-6 border border-gray-100 gap-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-xl transition-all text-sm font-medium ${step === s.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : step > s.id ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step === s.id ? 'bg-white/20' : step > s.id ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-0.5 w-4 shrink-0 rounded ${step > i ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
          {/* Preview toggle */}
          {step === 4 && generatedCV && (
            <button
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-1.5 ml-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-purple-600 border border-gray-200 hover:border-purple-300 shrink-0 transition-all"
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              <span className="hidden md:block">Preview</span>
            </button>
          )}
        </div>

        {/* Layout: form + preview */}
        <div className={`flex gap-6 ${showPreview && step === 4 && generatedCV ? 'items-start' : ''}`}>
          {/* Main form area */}
          <div className={showPreview && step === 4 && generatedCV ? 'flex-1 min-w-0' : 'w-full'}>
            <form onSubmit={handleSubmit(onSubmit)}>

              {/* ── Step 0: Personal Info ── */}
              {step === 0 && (
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <User className="text-purple-600" size={20} /> Personal Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { name: 'personalInfo.firstName' as const, label: 'First Name *', placeholder: 'Ahmed' },
                      { name: 'personalInfo.lastName' as const, label: 'Last Name *', placeholder: 'Al Mansouri' },
                      { name: 'personalInfo.email' as const, label: 'Email *', placeholder: 'ahmed@email.com', type: 'email' },
                      { name: 'personalInfo.phone' as const, label: 'Phone', placeholder: '+971 50 123 4567' },
                      { name: 'personalInfo.location' as const, label: 'Location', placeholder: 'Dubai, UAE' },
                      { name: 'personalInfo.nationality' as const, label: 'Nationality', placeholder: 'Emirati' },
                      { name: 'personalInfo.linkedIn' as const, label: 'LinkedIn URL', placeholder: 'linkedin.com/in/yourname', span: 2 },
                    ].map(field => (
                      <div key={field.name} className={(field as any).span === 2 ? 'md:col-span-2' : ''}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                        <input {...register(field.name)} type={(field as any).type || 'text'} placeholder={field.placeholder} className={inputCls} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-sm text-purple-700 font-medium mb-2">Target Role & Experience</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Target Role *</label>
                        <input {...register('targetRole', { required: true })} placeholder="e.g. Senior Software Engineer" className={inputCls} />
                        {errors.targetRole && <p className="text-xs text-red-500 mt-1">Required</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Years of Experience</label>
                        <input type="number" {...register('yearsOfExperience')} min={0} max={50} className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 1: Experience ── */}
              {step === 1 && (
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Briefcase className="text-purple-600" size={20} /> Work Experience
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">Add your work history. AI will enhance your descriptions with strong action verbs and metrics.</p>
                  {expFields.map((field, i) => {
                    const isCurrent = watch(`experience.${i}.current`);
                    return (
                      <div key={field.id} className="mb-5 p-5 border border-gray-100 rounded-2xl bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            Position {i + 1}
                          </h3>
                          {expFields.length > 1 && (
                            <button type="button" onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-all">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Company *</label>
                            <input {...register(`experience.${i}.company`)} placeholder="e.g. Emirates NBD" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Job Title *</label>
                            <input {...register(`experience.${i}.title`)} placeholder="e.g. Software Engineer" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                            <input {...register(`experience.${i}.startDate`)} placeholder="Jan 2022" className={inputCls} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                            <input
                              {...register(`experience.${i}.endDate`)}
                              placeholder={isCurrent ? 'Present' : 'Dec 2024'}
                              disabled={isCurrent}
                              className={`${inputCls} ${isCurrent ? 'bg-gray-100 text-gray-400' : ''}`}
                            />
                          </div>
                          <div className="md:col-span-2 flex items-center gap-2">
                            <input type="checkbox" {...register(`experience.${i}.current`)} id={`curr-${i}`} className="w-4 h-4 accent-purple-600" />
                            <label htmlFor={`curr-${i}`} className="text-sm text-gray-600 cursor-pointer">Currently working here</label>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Key Achievements / Description
                              <span className="text-gray-400 font-normal ml-1">(AI will enhance this)</span>
                            </label>
                            <textarea
                              {...register(`experience.${i}.description`)}
                              rows={3}
                              placeholder="e.g. Built REST APIs for 50K users, led team of 3, reduced load time by 40%, saved $200K in costs..."
                              className={`${inputCls} resize-none`}
                            />
                            <p className="text-xs text-gray-400 mt-1">Tip: Include numbers, percentages, and outcomes for better AI enhancement</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => appendExp({ company: '', title: '', startDate: '', endDate: '', current: false, description: '' })}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium p-2 rounded-xl hover:bg-purple-50 transition-all"
                  >
                    <Plus size={16} /> Add Another Position
                  </button>
                </div>
              )}

              {/* ── Step 2: Education ── */}
              {step === 2 && (
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <GraduationCap className="text-purple-600" size={20} /> Education & Certifications
                  </h2>

                  <h3 className="font-semibold text-gray-700 mb-4">Education</h3>
                  {eduFields.map((field, i) => (
                    <div key={field.id} className="mb-4 p-5 border border-gray-100 rounded-2xl bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-600">Qualification {i + 1}</span>
                        {eduFields.length > 1 && (
                          <button type="button" onClick={() => removeEdu(i)} className="text-red-400 hover:text-red-600">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Institution</label>
                          <input {...register(`education.${i}.institution`)} placeholder="University of Dubai" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Degree</label>
                          <input {...register(`education.${i}.degree`)} placeholder="Bachelor of Science" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Field of Study</label>
                          <input {...register(`education.${i}.field`)} placeholder="Computer Science" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Graduation Year</label>
                          <input {...register(`education.${i}.endDate`)} placeholder="2020" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => appendEdu({ institution: '', degree: '', field: '', endDate: '' })}
                    className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium mb-6 p-2 rounded-xl hover:bg-purple-50 transition-all">
                    <Plus size={16} /> Add Another Qualification
                  </button>

                  {/* Certifications */}
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Award size={16} className="text-purple-500" /> Certifications (optional)</h3>
                    {certFields.map((field, i) => (
                      <div key={field.id} className="mb-3 flex gap-3 items-start">
                        <div className="flex-1 grid md:grid-cols-3 gap-2">
                          <input {...register(`certifications.${i}.name`)} placeholder="Certification name" className={inputCls} />
                          <input {...register(`certifications.${i}.issuer`)} placeholder="Issuing org (optional)" className={inputCls} />
                          <input {...register(`certifications.${i}.year`)} placeholder="Year" className={inputCls} />
                        </div>
                        {certFields.length > 1 && (
                          <button type="button" onClick={() => removeCert(i)} className="text-red-400 hover:text-red-600 mt-2.5">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => appendCert({ name: '', issuer: '', year: '' })}
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium p-2 rounded-xl hover:bg-purple-50 transition-all">
                      <Plus size={16} /> Add Certification
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Skills & Target ── */}
              {step === 3 && (
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8 border border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Star className="text-purple-600" size={20} /> Skills & Job Target
                  </h2>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Skills *
                        <span className="text-gray-400 font-normal ml-2">— type a skill and press Enter or comma</span>
                      </label>
                      <TagsInput
                        tags={skillTags}
                        onAdd={t => setSkillTags(prev => [...prev, t])}
                        onRemove={t => setSkillTags(prev => prev.filter(s => s !== t))}
                        placeholder="e.g. React, Python, Project Management..."
                      />
                      {!skillTags.length && <p className="text-xs text-red-400 mt-1">Add at least one skill</p>}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {['JavaScript', 'Python', 'React', 'SQL', 'Excel', 'Leadership', 'Agile', 'PowerBI'].map(s => (
                          !skillTags.includes(s) && (
                            <button key={s} type="button" onClick={() => setSkillTags(prev => [...prev, s])}
                              className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-purple-100 hover:text-purple-700 transition-all border border-gray-200">
                              + {s}
                            </button>
                          )
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Job Description
                        <span className="text-gray-400 font-normal ml-2">— optional but recommended for ATS optimization</span>
                      </label>
                      <textarea
                        {...register('jobDescription')}
                        rows={6}
                        placeholder="Paste the job description you're applying for. Claude AI will optimize your CV keywords and content to match this specific role."
                        className={`${inputCls} resize-none`}
                      />
                    </div>
                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                      <Lightbulb className="text-amber-500 shrink-0 mt-0.5" size={18} />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Pro Tip</p>
                        <p className="text-xs text-amber-700 mt-0.5">Adding a job description allows Claude to extract the exact keywords ATS systems scan for, dramatically improving your match rate.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Step 4: Generated CV ── */}
              {step === 4 && (
                <div className="space-y-5">
                  {!generatedCV && (
                    <div className="bg-white rounded-3xl shadow-sm p-10 border border-gray-100 text-center">
                      <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${generateMutation.isPending ? 'bg-purple-100 animate-pulse' : 'bg-purple-50'}`}>
                        <Wand2 className="text-purple-500" size={32} />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">
                        {generateMutation.isPending ? 'Claude is crafting your CV...' : 'Ready to Generate!'}
                      </h2>
                      <p className="text-gray-500 mb-6">
                        {generateMutation.isPending
                          ? 'Writing your professional summary, enhancing experience bullets, and selecting ATS keywords...'
                          : 'Click below to have Claude AI craft your ATS-optimized CV content.'}
                      </p>
                      {generateMutation.isPending ? (
                        <div className="space-y-2 max-w-xs mx-auto">
                          {['Writing professional summary', 'Enhancing experience bullets', 'Selecting ATS keywords', 'Optimizing for your target role'].map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                              <Loader2 size={14} className="animate-spin text-purple-400" />{s}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="submit"
                          disabled={generateMutation.isPending}
                          className="flex items-center justify-center gap-3 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-2xl text-lg disabled:opacity-50 shadow-lg shadow-purple-200"
                        >
                          <Wand2 size={20} /> Generate My CV
                        </button>
                      )}
                    </div>
                  )}

                  {generatedCV && (
                    <>
                      {/* Professional Summary - editable */}
                      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-gray-900 flex items-center gap-2"><FileText className="text-purple-500" size={16} /> Professional Summary</h3>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => optimizeSummaryMutation.mutate()}
                              disabled={optimizeSummaryMutation.isPending}
                              className="flex items-center gap-1.5 text-xs text-indigo-600 border border-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                            >
                              {optimizeSummaryMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                              Optimize
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingSummary(v => !v)}
                              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                            >
                              <Edit3 size={11} /> {editingSummary ? 'Done' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(effectiveSummary).then(() => toast.success('Copied!'))}
                              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50"
                            >
                              <Copy size={11} /> Copy
                            </button>
                          </div>
                        </div>
                        {editingSummary ? (
                          <textarea
                            value={editedSummary}
                            onChange={e => setEditedSummary(e.target.value)}
                            rows={5}
                            className="w-full border border-purple-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none bg-purple-50"
                          />
                        ) : (
                          <p className="text-gray-700 text-sm leading-relaxed bg-purple-50 rounded-xl p-4 cursor-text" onClick={() => setEditingSummary(true)}>
                            {effectiveSummary}
                            <span className="ml-2 text-xs text-purple-400">(click to edit)</span>
                          </p>
                        )}
                      </div>

                      {/* Enhanced Experience - editable bullets */}
                      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="text-purple-500" size={16} /> Enhanced Experience</h3>
                        {generatedCV.enhancedExperience.map((exp, i) => (
                          <div key={i} className="mb-6 pb-6 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              {exp.title} — <span className="text-gray-500">{exp.company}</span>
                            </h4>
                            <ul className="space-y-2">
                              {effectiveBullets(i).map((bp, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-0.5 shrink-0 text-lg leading-none">•</span>
                                  {editingBulletIdx?.exp === i && editingBulletIdx?.bullet === j ? (
                                    <div className="flex-1 flex gap-2">
                                      <input
                                        value={editingBulletText}
                                        onChange={e => setEditingBulletText(e.target.value)}
                                        className="flex-1 border border-purple-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                                        autoFocus
                                      />
                                      <button type="button" onClick={() => {
                                        setEditedBullets(prev => ({ ...prev, [i]: effectiveBullets(i).map((b, idx) => idx === j ? editingBulletText : b) }));
                                        setEditingBulletIdx(null);
                                      }} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                                        <Check size={14} />
                                      </button>
                                      <button type="button" onClick={() => setEditingBulletIdx(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span
                                      className="text-sm text-gray-700 flex-1 cursor-text hover:text-purple-700 transition-colors"
                                      onClick={() => { setEditingBulletIdx({ exp: i, bullet: j }); setEditingBulletText(bp); }}
                                    >
                                      {bp}
                                      <span className="ml-1 text-xs text-purple-300 opacity-0 group-hover:opacity-100">(edit)</span>
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                            <p className="text-xs text-gray-400 mt-2">Click any bullet to edit it</p>
                          </div>
                        ))}
                      </div>

                      {/* Skills & Keywords */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Star className="text-purple-500" size={15} /> AI-Suggested Skills</h3>
                          <div className="flex flex-wrap gap-2">
                            {generatedCV.suggestedSkills.map(s => (
                              <span key={s} className={`px-2.5 py-1 text-xs rounded-full border cursor-pointer transition-all ${skillTags.includes(s) ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'}`}
                                onClick={() => setSkillTags(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}>
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Click to add/remove from your CV</p>
                        </div>
                        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
                          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Lightbulb className="text-amber-500" size={15} /> ATS Keywords</h3>
                          <div className="flex flex-wrap gap-2">
                            {generatedCV.atsKeywords.map(k => (
                              <span key={k} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">{k}</span>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mt-2">Include these in your CV to pass ATS filters</p>
                        </div>
                      </div>

                      {/* Export */}
                      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-4">Export Your CV</h3>
                        <div className="flex flex-wrap gap-3">
                          <button type="button" onClick={() => { const t = buildCVText(); navigator.clipboard.writeText(t); toast.success('Copied!'); }}
                            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:border-purple-400 hover:text-purple-600 transition-all">
                            <Copy size={14} /> Copy Text
                          </button>
                          <button type="button" onClick={() => {
                            const blob = new Blob([buildCVText()], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a'); a.href = url;
                            a.download = `${formData.personalInfo.firstName || 'My'}_${formData.personalInfo.lastName || 'CV'}_CV.txt`;
                            a.click(); URL.revokeObjectURL(url);
                            toast.success('Downloaded!');
                          }} className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:border-purple-400 hover:text-purple-600 transition-all">
                            <Download size={14} /> Download TXT
                          </button>
                          <button type="button" onClick={() => downloadPDF(formData)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm hover:from-purple-700 hover:to-indigo-700 shadow-sm transition-all">
                            <Download size={14} /> Download PDF
                          </button>
                          <button type="button" onClick={() => generateMutation.mutate(formData)} disabled={generateMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-purple-600 rounded-xl text-sm hover:bg-purple-50 disabled:opacity-50 transition-all">
                            {generateMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                            Regenerate
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

            </form>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-purple-300 disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={16} /> Back
              </button>
              {step < 3 && (
                <button
                  onClick={() => setStep(s => Math.min(4, s + 1))}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-sm shadow-purple-200 transition-all"
                >
                  Next <ChevronRight size={16} />
                </button>
              )}
              {step === 3 && (
                <button
                  type="button"
                  onClick={() => handleSubmit(onSubmit)()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm shadow-purple-200 transition-all"
                >
                  <Wand2 size={16} /> Generate CV <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          {showPreview && step === 4 && generatedCV && (
            <div className="w-72 shrink-0 hidden lg:block" ref={previewRef}>
              <div className="sticky top-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-600 flex items-center gap-1.5"><Eye size={14} /> Live Preview</p>
                  <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                    <EyeOff size={14} />
                  </button>
                </div>
                <CVPreview data={formData} generated={generatedCV} skills={skillTags} />
              </div>
            </div>
          )}
        </div>

        {/* Preview toggle for step < 4 */}
        {step < 4 && (
          <div className="mt-6">
            <button
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
              {showPreview ? 'Hide' : 'Show'} Live CV Preview
            </button>
            {showPreview && (
              <div className="mt-4 max-w-md">
                <CVPreview data={formData} generated={generatedCV} skills={skillTags} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
