import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Search, Copy, Share2, Check, Users, MessageCircle,
  ExternalLink, Pin, Star, Globe, Instagram, Twitter,
  Linkedin, ChevronDown, Bell, Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

interface WhatsAppGroup {
  id: string;
  title: string;
  description?: string;
  link: string;
  category: string;
  emoji: string;
  memberCount?: number;
  maxMembers?: number;
  isPinned: boolean;
  clickCount: number;
  tags: string[];
}

interface PageSettings {
  name: string;
  tagline?: string;
  bio?: string;
  avatarUrl?: string;
  bannerText?: string;
  bannerColor: string;
  theme: string;
  socialLinks?: { instagram?: string; twitter?: string; linkedin?: string; website?: string };
  showStats: boolean;
  isPublished: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Jobs:       'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Tech:       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Business:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
  News:       'bg-red-500/20 text-red-300 border-red-500/30',
  Community:  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Education:  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  Finance:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Health:     'bg-rose-500/20 text-rose-300 border-rose-500/30',
  Sports:     'bg-orange-500/20 text-orange-300 border-orange-500/30',
  General:    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function GroupCard({
  group, onJoin, onCopy, copiedId, featured = false,
}: {
  group: WhatsAppGroup;
  onJoin: (g: WhatsAppGroup) => void;
  onCopy: (id: string, link: string) => void;
  copiedId: string | null;
  featured?: boolean;
}) {
  const categoryColor = CATEGORY_COLORS[group.category] ?? CATEGORY_COLORS.General;
  const isCopied = copiedId === group.id;

  const fillPct = group.memberCount && group.maxMembers
    ? Math.min(100, Math.round((group.memberCount / group.maxMembers) * 100))
    : null;

  return (
    <div
      className={`group relative rounded-2xl p-4 backdrop-blur-sm border transition-all duration-300 hover:scale-[1.015] hover:shadow-2xl ${
        featured
          ? 'bg-gradient-to-br from-amber-500/15 to-yellow-500/8 border-amber-500/40 hover:border-amber-400/60 shadow-amber-500/10'
          : 'bg-white/8 border-white/10 hover:bg-white/12 hover:border-white/25 shadow-black/10'
      } shadow-lg`}
    >
      {featured && (
        <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Star className="w-3 h-3 fill-current" /> Featured
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Emoji Icon */}
        <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
          featured ? 'bg-amber-500/20' : 'bg-white/10'
        }`}>
          {group.emoji}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-semibold text-base leading-tight">{group.title}</h3>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full border ${categoryColor}`}>
              {group.category}
            </span>
          </div>

          {group.description && (
            <p className="text-white/55 text-sm mt-1 line-clamp-2 leading-relaxed">{group.description}</p>
          )}

          {/* Members + capacity */}
          {group.memberCount && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {group.memberCount.toLocaleString()}
                  {group.maxMembers ? ` / ${group.maxMembers.toLocaleString()} members` : ' members'}
                </span>
                {fillPct !== null && (
                  <span className={fillPct >= 90 ? 'text-red-400' : fillPct >= 70 ? 'text-amber-400' : 'text-emerald-400'}>
                    {fillPct}% full
                  </span>
                )}
              </div>
              {fillPct !== null && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-red-400' : fillPct >= 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {group.tags.slice(0, 4).map(tag => (
                <span key={tag} className="inline-flex items-center gap-0.5 text-xs text-white/35 bg-white/5 px-1.5 py-0.5 rounded">
                  <Hash className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          )}

          {group.clickCount > 0 && (
            <p className="text-white/25 text-xs mt-1.5">{group.clickCount.toLocaleString()} people joined</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex-shrink-0 flex flex-col gap-2 items-end">
          <button
            onClick={() => onJoin(group)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bc5a] active:bg-[#1aab52] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 hover:scale-105"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Join
          </button>
          <button
            onClick={() => onCopy(group.id, group.link)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 hover:bg-white/15 text-white/60 hover:text-white text-xs rounded-xl transition-all border border-white/8 hover:border-white/20"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {isCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function WhatsAppGroups() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-links-public'],
    queryFn: () => api.get('/whatsapp-links').then(r => r.data.data),
  });

  const clickMutation = useMutation({
    mutationFn: (id: string) => api.post(`/whatsapp-links/${id}/click`),
  });

  const page: PageSettings = data?.page ?? {
    name: 'Join Our WhatsApp Groups',
    bannerColor: '#10b981',
    theme: 'emerald',
    showStats: true,
    isPublished: true,
  };
  const groups: WhatsAppGroup[] = data?.groups ?? [];

  const categories = ['All', ...Array.from(new Set(groups.map(g => g.category))).sort()];

  const filtered = groups.filter(g => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || g.title.toLowerCase().includes(q)
      || g.description?.toLowerCase().includes(q)
      || g.category.toLowerCase().includes(q)
      || g.tags.some(t => t.toLowerCase().includes(q));
    const matchCat = activeCategory === 'All' || g.category === activeCategory;
    return matchSearch && matchCat;
  });

  const pinned = filtered.filter(g => g.isPinned);
  const rest = filtered.filter(g => !g.isPinned);
  const visibleRest = showAll ? rest : rest.slice(0, 8);

  function handleCopy(id: string, link: string) {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      toast.success('Link copied!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function handleJoin(group: WhatsAppGroup) {
    clickMutation.mutate(group.id);
    window.open(group.link, '_blank', 'noopener,noreferrer');
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: page.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() =>
        toast.success('Page link copied!')
      );
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-green-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/10 border-t-emerald-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm">Loading groups…</p>
        </div>
      </div>
    );
  }

  if (!page.isPublished && groups.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-green-950 flex items-center justify-center">
        <div className="text-center text-white/40">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p>Coming soon…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-950 to-green-950 relative overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-60 -right-60 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-60 -left-60 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-green-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-10 pb-24">

        {/* Announcement Banner */}
        {page.bannerText && (
          <div
            className="mb-6 rounded-2xl px-4 py-3 text-center text-sm font-medium text-white backdrop-blur-sm border flex items-center justify-center gap-2"
            style={{ backgroundColor: page.bannerColor + '22', borderColor: page.bannerColor + '44' }}
          >
            <Bell className="w-4 h-4 flex-shrink-0" style={{ color: page.bannerColor }} />
            {page.bannerText}
          </div>
        )}

        {/* Profile Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            {page.avatarUrl ? (
              <img
                src={page.avatarUrl}
                alt={page.name}
                className="w-24 h-24 rounded-full border-4 border-white/15 object-cover shadow-2xl shadow-black/40"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white/15 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                <svg viewBox="0 0 24 24" className="w-11 h-11 fill-white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#25D366] rounded-full border-2 border-emerald-950 flex items-center justify-center shadow-lg">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 leading-tight">{page.name}</h1>
          {page.tagline && (
            <p className="text-emerald-300 text-base font-medium mb-2">{page.tagline}</p>
          )}
          {page.bio && (
            <p className="text-white/55 text-sm max-w-sm mx-auto leading-relaxed">{page.bio}</p>
          )}

          {/* Social links */}
          {page.socialLinks && Object.values(page.socialLinks).some(Boolean) && (
            <div className="flex items-center justify-center gap-3 mt-4">
              {page.socialLinks.website && (
                <a href={page.socialLinks.website} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {page.socialLinks.instagram && (
                <a href={page.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {page.socialLinks.twitter && (
                <a href={page.socialLinks.twitter} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {page.socialLinks.linkedin && (
                <a href={page.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all hover:scale-110">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          )}

          {/* Stats */}
          {page.showStats && groups.length > 0 && (
            <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-white/8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{groups.length}</div>
                <div className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Groups</div>
              </div>
              {groups.some(g => g.memberCount) && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {(groups.reduce((s, g) => s + (g.memberCount ?? 0), 0) / 1000).toFixed(1)}K+
                  </div>
                  <div className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Members</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {groups.reduce((s, g) => s + g.clickCount, 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Joins</div>
              </div>
            </div>
          )}

          {/* Share button */}
          <button
            onClick={handleShare}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/18 text-white text-sm font-medium transition-all border border-white/10 hover:border-white/25 backdrop-blur-sm hover:scale-105"
          >
            <Share2 className="w-4 h-4" />
            Share This Page
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
          <input
            type="text"
            placeholder="Search groups, categories, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-emerald-400/50 focus:bg-white/12 transition-all text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
            >×</button>
          )}
        </div>

        {/* Category Tabs */}
        {categories.length > 2 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/25'
                    : 'bg-white/8 text-white/55 hover:bg-white/15 hover:text-white border border-white/8'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Featured / Pinned Groups */}
        {pinned.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 text-amber-400/70 text-xs font-bold uppercase tracking-widest mb-3">
              <Pin className="w-3 h-3" /> Featured Groups
            </div>
            <div className="space-y-3">
              {pinned.map(g => (
                <GroupCard key={g.id} group={g} onJoin={handleJoin} onCopy={handleCopy} copiedId={copiedId} featured />
              ))}
            </div>
          </div>
        )}

        {/* All Groups */}
        {rest.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest mb-3">
                <MessageCircle className="w-3 h-3" /> All Groups
              </div>
            )}
            <div className="space-y-3">
              {visibleRest.map(g => (
                <GroupCard key={g.id} group={g} onJoin={handleJoin} onCopy={handleCopy} copiedId={copiedId} />
              ))}
            </div>
            {rest.length > 8 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-4 py-3 rounded-2xl bg-white/8 hover:bg-white/12 border border-white/8 hover:border-white/20 text-white/60 hover:text-white text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Show {rest.length - 8} more groups
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-white/40 font-medium">No groups found</p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-emerald-400 text-sm hover:underline">
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-14 pb-4">
          <div className="inline-flex items-center gap-2 text-white/20 text-xs">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current opacity-50" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Powered by ddotsmediajobs
          </div>
        </div>
      </div>
    </div>
  );
}
