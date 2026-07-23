import React, { useState, useEffect } from 'react';
import { Filter, Calendar } from 'lucide-react';
import api from '../../services/api';

const FilterBar = ({
  filters = {},
  onChange,
  disabled = false,
  className = ''
}) => {
  const [surveys, setSurveys] = useState([]);
  const [sites, setSites] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [habitats, setHabitats] = useState([]);

  // Fetch surveys and sites from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [surveysRes, sitesRes] = await Promise.all([
          api.get('/api/surveys'),
          api.get('/api/monitoring-sites')
        ]);
        
        const surveysData = surveysRes.data || [];
        const sitesData = sitesRes.data || [];
        
        setSurveys(surveysData);
        setSites(sitesData);
        
        // Extract unique habitats from surveys
        const uniqueHabitats = [...new Set(surveysData.map(s => s.habitat_type).filter(Boolean))];
        setHabitats(uniqueHabitats);
      } catch (err) {
        console.error("FilterBar: Error fetching options:", err);
      }
    };
    
    fetchOptions();
  }, []);

  // Fetch unique observed species list from population species endpoint
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await api.get('/api/population/species');
        const names = [...new Set((res.data || []).map(item => item.species_name).filter(Boolean))];
        setSpeciesList(names);
      } catch (err) {
        console.error("FilterBar: Error fetching species list:", err);
      }
    };
    
    fetchSpecies();
  }, []);

  const handleSelectChange = (key, value) => {
    if (onChange) {
      onChange({
        ...filters,
        [key]: value === "" ? undefined : value
      });
    }
  };

  const handleDateRangeChange = (e) => {
    const range = e.target.value;
    let dateFrom = undefined;
    const dateTo = new Date().toISOString();

    if (range === '30days') {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === '90days') {
      dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === 'year') {
      dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    if (onChange) {
      onChange({
        ...filters,
        dateRangePreset: range,
        date_from: dateFrom,
        date_to: range ? dateTo : undefined
      });
    }
  };

  return (
    <div className={`glass-card p-4 border-slate-202 dark:border-slate-805 shadow-sm ${className}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Header */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Intelligence Filters</h4>
            <span className="text-5xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider block">
              {disabled ? 'Offline Mode' : 'Connected to Live DB'}
            </span>
          </div>
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full lg:w-auto flex-1">
          {/* Survey Filter */}
          <div className="space-y-1">
            <label className="text-5xs uppercase tracking-wider text-slate-500 dark:text-slate-500 font-bold block">
              Survey
            </label>
            <select 
              disabled={disabled} 
              className="enterprise-select w-full"
              value={filters.survey_id || ""}
              onChange={(e) => handleSelectChange('survey_id', e.target.value ? parseInt(e.target.value) : "")}
            >
              <option value="">All Surveys</option>
              {surveys.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Monitoring Site Filter */}
          <div className="space-y-1">
            <label className="text-5xs uppercase tracking-wider text-slate-505 dark:text-slate-500 font-bold block">
              Monitoring Site
            </label>
            <select 
              disabled={disabled} 
              className="enterprise-select w-full"
              value={filters.site_id || ""}
              onChange={(e) => handleSelectChange('site_id', e.target.value ? parseInt(e.target.value) : "")}
            >
              <option value="">All Sites</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          {/* Species Filter */}
          <div className="space-y-1">
            <label className="text-5xs uppercase tracking-wider text-slate-505 dark:text-slate-500 font-bold block">
              Species
            </label>
            <select 
              disabled={disabled} 
              className="enterprise-select w-full"
              value={filters.species || ""}
              onChange={(e) => handleSelectChange('species', e.target.value)}
            >
              <option value="">All Species</option>
              {speciesList.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Habitat Filter */}
          <div className="space-y-1">
            <label className="text-5xs uppercase tracking-wider text-slate-505 dark:text-slate-500 font-bold block">
              Habitat Type
            </label>
            <select 
              disabled={disabled} 
              className="enterprise-select w-full"
              value={filters.habitat || ""}
              onChange={(e) => handleSelectChange('habitat', e.target.value)}
            >
              <option value="">All Habitats</option>
              {habitats.map(hab => (
                <option key={hab} value={hab}>{hab}</option>
              ))}
            </select>
          </div>

          {/* Date Range Preset Filter */}
          <div className="space-y-1">
            <label className="text-5xs uppercase tracking-wider text-slate-505 dark:text-slate-500 font-bold block">
              Date Range
            </label>
            <div className="relative">
              <select 
                disabled={disabled}
                className="enterprise-select w-full pr-8"
                value={filters.dateRangePreset || ""}
                onChange={handleDateRangeChange}
              >
                <option value="">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
              <Calendar className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
