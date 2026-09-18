import React, { useState, useEffect } from 'react';
import { BookOpen, Search, MapPin, Phone, Mail, Eye, MessageSquare, ExternalLink } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/listings', {
        params: { search: search || undefined, category: category || undefined }
      });
      if (res.success) setListings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [search, category]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Yellow Pages Directory Listings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live published business profiles visible on the public Yellow Pages directory
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings by name, phone, city..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-amber-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-500"
          >
            <option value="">All Categories</option>
            <option value="Restaurants & Food">Restaurants & Food</option>
            <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
            <option value="IT & Software">IT & Software</option>
            <option value="Apparel & Retail">Apparel & Retail</option>
            <option value="Automobiles & Services">Automobiles & Services</option>
          </select>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Loading directory listings...
          </div>
        ) : listings.length > 0 ? (
          listings.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1.5 line-clamp-1">
                      {item.businessName}
                    </h3>
                  </div>
                  <StatusBadge status={item.listingStatus} />
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.description || 'Verified local business listing on Yellow Pages.'}
                </p>

                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2 font-mono font-medium text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{item.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      {item.city}, {item.state}
                    </span>
                  </div>
                </div>
              </div>

              {/* Views & Inquiries Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{item.views || 0} views</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{item.inquiries || 0} inquiries</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            No published directory listings found.
          </div>
        )}
      </div>
    </div>
  );
}
