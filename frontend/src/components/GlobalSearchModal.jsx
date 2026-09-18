import React, { useState, useEffect, useRef } from 'react';
import { Search, Phone, MapPin, Building2, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

export default function GlobalSearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/leads', {
          params: { search: query.trim(), limit: 8 }
        });
        if (res.success) {
          setResults(res.data || []);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectLead = (leadId) => {
    onClose();
    navigate(`/leads/${leadId}`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Search" maxWidth="max-w-2xl">
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by phone, business name, owner, city, lead ID..."
          className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-3.5 w-5 h-5 text-amber-500 animate-spin" />
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {results.length > 0 ? (
          results.map((lead) => (
            <div
              key={lead._id}
              onClick={() => handleSelectLead(lead._id)}
              className="group p-3.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 cursor-pointer transition flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-amber-800 bg-amber-100/60 px-1.5 py-0.5 rounded">
                    {lead.leadId}
                  </span>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-amber-900 transition">
                    {lead.businessName}
                  </h4>
                  <StatusBadge status={lead.currentStatus} />
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {lead.phoneNumbers?.join(', ') || 'No phone'}
                  </span>
                  {lead.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {lead.city}, {lead.state}
                    </span>
                  )}
                  {lead.ownerName && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {lead.ownerName}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition group-hover:translate-x-0.5" />
            </div>
          ))
        ) : query.trim() && !loading ? (
          <div className="py-8 text-center text-sm text-slate-500">
            No businesses found matching <span className="font-semibold text-slate-700">"{query}"</span>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            Type 10-digit phone number or business name to search across all India data
          </div>
        )}
      </div>
    </Modal>
  );
}
