import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import {
  User, Briefcase, GraduationCap, Star, Plus, Trash2,
  Wand2, Loader2, ChevronRight, ChevronLeft, Copy, Download,
  Lightbulb, FileText,
} from 'lucide-react';
import { api, getApiError } from '../../lib/api';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn: string;
}

interface Experience {
  company: string;
  title: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  institution: string;
  degree: string;
  field: string;
  endDate: string;
}

interface BuilderFormData {
  personalInfo: PersonalInfo;
  targetRole: string;
  yearsOfExperience: number;
  skills: string;
  jobDescription: string;
  experience: Experience[];
  education: Education[];
}

interface GeneratedCV {
  professionalSummary: string;
  enhancedExperience: Array<{
    company: string;
    title: string;
    bulletPoints: string[];
  }>;
  suggestedSkills: string[];
  atsKeywords: string[];
}

const STEPS = [
  { id: 0, label: 'Personal', icon: <User size={16} /> },
  { id: 1, label: 'Experience', icon: <Briefcase size={16} /> },
  { id: 2, label: 'Education', icon: <GraduationCap size={16} /> },
  { id: 3, label: 'Skills & Target', icon: <Star size={16} /> },
  { id: 4, label: 'AI Generate', icon: <Wand2 size={16} /> },
];

export function CVBuilder() {
  const [step, setStep] = useState(0);
  const [generatedCV, setGeneratedCV] = useState<GeneratedCV | null>(null);

  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<BuilderFormData>({
    defaultValues: {
      personalInfo: { firstName: '', lastName: '', email: '', phone: '', location: '', linkedIn: '' },
      targetRole: '',
      yearsOfExperience: 0,
      skills: '',
      jobDescription: '',
      experience: [{ company: '', title: '', startDate: '', endDate: '', current: false, description: '' }],
      education: [{ institution: '', degree: '', field: '', endDate: '' }],
    },
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });

  const generateMutation = useMutation({
    mutationFn: async (data: BuilderFormData) => {
      const payload = {
        personalInfo: data.personalInfo,
        targetRole: data.targetRole,
        yearsOfExperience: Number(data.yearsOfExperience),
        skills: data.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience: data.experience,
        education: data.education,
        jobDescription: data.jobDescription || undefined,
      };
      const { data: res } = await api.post('/cv/generate', payload);
      return res.data as GeneratedCV;
    },
    onSuccess: (data) => {
      setGeneratedCV(data);
      toast.success('CV content generated successfully!');
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const optimizeMutation = useMutation({
    mutationFn: async ({ section, content }: { section: string; content: string }) => {
      const { data } = await api.post('/cv/optimize', {
        section,
        content,
        jobDescription: watch('jobDescription') || 'General professional role',
      });
      return data.data;
    },
    onSuccess: () => toast.success('Section optimized!'),
    onError: (err) => toast.error(getApiError(err)),
  });

  const onSubmit = (data: BuilderFormData) => {
    generateMutation.mutate(data);
    setStep(4);
  };

  const buildCVText = (data: BuilderFormData, gen: GeneratedCV) => {
    const lines: string[] = [];
    const pi = data.personalInfo;
    lines.push(`${pi.firstName} ${pi.lastName}`);
    lines.push([pi.email, pi.phone, pi.location].filter(Boolean).join(' | '));
    if (pi.linkedIn) lines.push(pi.linkedIn);
    lines.push('');
    lines.push('PROFESSIONAL SUMMARY');
    lines.push('─'.repeat(40));
    lines.push(gen.professionalSummary);
    lines.push('');
    lines.push('WORK EXPERIENCE');
    lines.push('─'.repeat(40));
    gen.enhancedExperience.forEach(exp => {
      lines.push(`${exp.title} | ${exp.company}`);
      exp.bulletPoints.forEach(bp => lines.push(`• ${bp}`));
      lines.push('');
    });
    lines.push('EDUCATION');
    lines.push('─'.repeat(40));
    data.education.forEach(edu => {
      lines.push(`${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.institution}${edu.endDate ? ` (${edu.endDate})` : ''}`);
    });
    lines.push('');
    lines.push('SKILLS');
    lines.push('─'.repeat(40));
    lines.push(gen.suggestedSkills.join(' • '));
    return lines.join('\n');
  };

  const downloadPDF = (data: BuilderFormData, gen: GeneratedCV) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pi = data.personalInfo;
    const pageW = 210;
    const margin = 18;
    const usableW = pageW - margin * 2;
    let y = 20;

    const addLine = (text: string, size = 10, bold = false, color = '#1a1a1a') => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, usableW) as string[];
      lines.forEach((line: string) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += size * 0.45;
      });
    };

    const addSection = (title: string) => {
      y += 4;
      doc.setDrawColor('#6d28d9');
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      addLine(title, 11, true, '#6d28d9');
      y += 2;
    };

    // Header
    addLine(`${pi.firstName} ${pi.lastName}`, 18, true, '#1a1a1a');
    y += 1;
    const contactParts = [pi.email, pi.phone, pi.location].filter(Boolean);
    addLine(contactParts.join('  •  '), 9, false, '#555555');
    if (pi.linkedIn) addLine(pi.linkedIn, 9, false, '#6d28d9');
    y += 2;

    // Summary
    addSection('PROFESSIONAL SUMMARY');
    addLine(gen.professionalSummary, 10);

    // Experience
    addSection('WORK EXPERIENCE');
    gen.enhancedExperience.forEach((exp) => {
      addLine(`${exp.title} — ${exp.company}`, 10, true);
      exp.bulletPoints.forEach((bp) => addLine(`• ${bp}`, 9.5));
      y += 2;
    });

    // Education
    addSection('EDUCATION');
    data.education.forEach((edu) => {
      const text = `${edu.degree}${edu.field ? ` in ${edu.field}` : ''} — ${edu.institution}${edu.endDate ? `  (${edu.endDate})` : ''}`;
      addLine(text, 10);
    });

    // Skills
    addSection('SKILLS');
    addLine(gen.suggestedSkills.join('  •  '), 10);

    // Keywords
    if (gen.atsKeywords.length) {
      addSection('ATS KEYWORDS');
      addLine(gen.atsKeywords.join('  •  '), 9.5, false, '#555555');
    }

    doc.save(`${pi.firstName}_${pi.lastName}_CV.pdf`);
    toast.success('PDF downloaded!');
  };

  const formData = watch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-700 to-indigo-700 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-4">
            <Wand2 size={14} className="text-yellow-400" />
            AI-Powered CV Builder
          </div>
          <h1 className="text-4xl font-extrabold mb-3">Build an ATS-Optimized CV</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            Fill in your details and let Claude AI craft compelling, ATS-ready content —
            professional summary, achievement-focused bullet points, and keyword optimization.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-10 bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={`flex flex-col items-center gap-1 flex-1 transition-all ${step === s.id ? 'text-purple-700' : step > s.id ? 'text-green-600' : 'text-gray-400'}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' :
                  step > s.id ? 'bg-green-500 text-white' : 'bg-gray-100'
                }`}>
                  {step > s.id ? '✓' : s.icon}
                </div>
                <span className="text-xs font-medium hidden sm:block">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 max-w-8 ${step > i ? 'bg-green-400' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 0: Personal Info */}
          {step === 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="text-purple-600" size={20} /> Personal Information
              </h2>
              <div className="grid md:grid-cols-2 gap-5">
                {[
                  { name: 'personalInfo.firstName' as const, label: 'First Name', placeholder: 'Ahmed' },
                  { name: 'personalInfo.lastName' as const, label: 'Last Name', placeholder: 'Al Mansouri' },
                  { name: 'personalInfo.email' as const, label: 'Email', placeholder: 'ahmed@email.com' },
                  { name: 'personalInfo.phone' as const, label: 'Phone', placeholder: '+971 50 123 4567' },
                  { name: 'personalInfo.location' as const, label: 'Location', placeholder: 'Dubai, UAE' },
                  { name: 'personalInfo.linkedIn' as const, label: 'LinkedIn URL', placeholder: 'linkedin.com/in/yourname' },
                ].map(field => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                    <input
                      {...register(field.name)}
                      placeholder={field.placeholder}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Experience */}
          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Briefcase className="text-purple-600" size={20} /> Work Experience
              </h2>
              {expFields.map((field, i) => (
                <div key={field.id} className="mb-6 p-5 border border-gray-100 rounded-2xl bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Position {i + 1}</h3>
                    {expFields.length > 1 && (
                      <button type="button" onClick={() => removeExp(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Company</label>
                      <input {...register(`experience.${i}.company`)} placeholder="Acme Corp" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Job Title</label>
                      <input {...register(`experience.${i}.title`)} placeholder="Software Engineer" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                      <input {...register(`experience.${i}.startDate`)} placeholder="Jan 2022" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                      <input {...register(`experience.${i}.endDate`)} placeholder="Dec 2024 or Present" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">Brief Description (AI will enhance this)</label>
                      <textarea {...register(`experience.${i}.description`)} rows={3} placeholder="Built REST APIs, managed team of 3, reduced load time by 40%..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendExp({ company: '', title: '', startDate: '', endDate: '', current: false, description: '' })}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                <Plus size={16} /> Add Another Position
              </button>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="text-purple-600" size={20} /> Education
              </h2>
              {eduFields.map((field, i) => (
                <div key={field.id} className="mb-6 p-5 border border-gray-100 rounded-2xl bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-700">Qualification {i + 1}</h3>
                    {eduFields.length > 1 && (
                      <button type="button" onClick={() => removeEdu(i)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Institution</label>
                      <input {...register(`education.${i}.institution`)} placeholder="University of Dubai" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Degree</label>
                      <input {...register(`education.${i}.degree`)} placeholder="Bachelor of Science" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Field of Study</label>
                      <input {...register(`education.${i}.field`)} placeholder="Computer Science" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Graduation Year</label>
                      <input {...register(`education.${i}.endDate`)} placeholder="2020" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendEdu({ institution: '', degree: '', field: '', endDate: '' })}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-800 text-sm font-medium"
              >
                <Plus size={16} /> Add Another Qualification
              </button>
            </div>
          )}

          {/* Step 3: Skills & Target */}
          {step === 3 && (
            <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="text-purple-600" size={20} /> Skills & Target Role
              </h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Role *</label>
                  <input
                    {...register('targetRole', { required: true })}
                    placeholder="e.g. Senior Software Engineer, Marketing Manager"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                  <input
                    type="number"
                    {...register('yearsOfExperience')}
                    min={0} max={50}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Skills (comma-separated) *</label>
                  <input
                    {...register('skills', { required: true })}
                    placeholder="React, Node.js, TypeScript, Project Management, SQL..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">Add all your technical and soft skills separated by commas</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Job Description <span className="text-gray-400">(optional but recommended)</span>
                  </label>
                  <textarea
                    {...register('jobDescription')}
                    rows={5}
                    placeholder="Paste the job description you're targeting. AI will optimize your CV keywords for it."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Generated CV */}
          {step === 4 && (
            <div className="space-y-6">
              {!generatedCV && (
                <div className="bg-white rounded-3xl shadow-lg p-10 border border-gray-100 text-center">
                  <Wand2 className="mx-auto text-purple-400 mb-4" size={48} />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Generate!</h2>
                  <p className="text-gray-500 mb-6">Click below to have Claude AI craft your professional CV content.</p>
                  <button
                    type="submit"
                    disabled={generateMutation.isPending}
                    className="flex items-center justify-center gap-3 mx-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-10 rounded-2xl text-lg disabled:opacity-50 shadow-lg shadow-purple-200"
                  >
                    {generateMutation.isPending ? (
                      <><Loader2 className="animate-spin" size={20} /> Generating with AI...</>
                    ) : (
                      <><Wand2 size={20} /> Generate My CV</>
                    )}
                  </button>
                </div>
              )}

              {generatedCV && (
                <>
                  {/* Professional Summary */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="text-purple-600" size={18} /> Professional Summary
                      </h3>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(generatedCV.professionalSummary)}
                        className="text-xs text-gray-400 hover:text-purple-600 flex items-center gap-1"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed bg-purple-50 rounded-xl p-4">
                      {generatedCV.professionalSummary}
                    </p>
                  </div>

                  {/* Enhanced Experience */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="text-purple-600" size={18} /> Enhanced Experience Bullets
                    </h3>
                    {generatedCV.enhancedExperience.map((exp, i) => (
                      <div key={i} className="mb-5 pb-5 border-b border-gray-100 last:border-0 last:mb-0 last:pb-0">
                        <h4 className="font-semibold text-gray-800 mb-2">{exp.title} — {exp.company}</h4>
                        <ul className="space-y-1.5">
                          {exp.bulletPoints.map((bp, j) => (
                            <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-purple-500 mt-1 shrink-0">•</span>
                              {bp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  {/* Skills & Keywords */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="text-purple-600" size={16} /> Suggested Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedCV.suggestedSkills.map(s => (
                          <span key={s} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Lightbulb className="text-amber-500" size={16} /> ATS Keywords to Include
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedCV.atsKeywords.map(k => (
                          <span key={k} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full border border-amber-200">{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Export */}
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">Export Your CV</h3>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const text = buildCVText(formData, generatedCV);
                          navigator.clipboard.writeText(text);
                          toast.success('CV copied to clipboard!');
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:border-purple-400 hover:text-purple-600 transition-all"
                      >
                        <Copy size={15} /> Copy as Text
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const text = buildCVText(formData, generatedCV);
                          const blob = new Blob([text], { type: 'text/plain' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `${formData.personalInfo.firstName}_${formData.personalInfo.lastName}_CV.txt`;
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm hover:bg-purple-700 transition-all"
                      >
                        <Download size={15} /> Download TXT
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadPDF(formData, generatedCV)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition-all"
                      >
                        <Download size={15} /> Download PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => { generateMutation.mutate(formData); }}
                        disabled={generateMutation.isPending}
                        className="flex items-center gap-2 px-4 py-2.5 border border-purple-200 text-purple-600 rounded-xl text-sm hover:bg-purple-50 transition-all disabled:opacity-50"
                      >
                        {generateMutation.isPending ? <Loader2 className="animate-spin" size={15} /> : <Wand2 size={15} />}
                        Regenerate
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </form>

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-purple-300 disabled:opacity-40"
          >
            <ChevronLeft size={16} /> Previous
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep(s => Math.min(4, s + 1))}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 shadow-md shadow-purple-200"
            >
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
