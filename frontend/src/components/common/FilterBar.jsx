import React, { useState, useEffect, useRef } from 'react';
import { Filter, Calendar } from 'lucide-react';
import api from '../../services/api';
import { localizeSpeciesName } from '../../utils/india';

const CustomSelect = ({ value, onChange, options, placeholder, label, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectedOption = options.find(o => o.value === value) || { label: placeholder, value: "" };

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative space-y-1 w-full" ref={containerRef}>
      <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500 font-black block">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left flex justify-between items-center h-9 px-3 py-1.5 border rounded-xl bg-slate-50 dark:bg-slate-900 text-xs border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors duration-150 disabled:opacity-50"
      >
        <span className="truncate text-slate-850 dark:text-slate-200 font-semibold">{selectedOption.label}</span>
        <span className="text-slate-400 text-[8px] ml-1 shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1.5 z-30 animate-fade-in">
          {options.length > 10 && (
            <div className="px-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full px-2 py-1 text-2xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none text-slate-800 dark:text-slate-200"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-2xs text-slate-400 italic">No options found</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center px-3 py-1.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                    opt.value === value ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 font-bold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Local state to buffer dropdown changes
  const [localFilters, setLocalFilters] = useState(filters);

  // Sync local filters when parent prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Fetch options
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
        
        const uniqueHabitats = [...new Set(surveysData.map(s => s.habitat_type).filter(Boolean))];
        setHabitats(uniqueHabitats);
      } catch (err) {
        console.error("FilterBar: Error fetching options:", err);
      }
    };
    
    fetchOptions();
  }, []);

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
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === "" ? undefined : value
    }));
  };

  const handleDateRangeChange = (value) => {
    const range = value;
    let dateFrom = undefined;
    const dateTo = new Date().toISOString();

    if (range === '30days') {
      dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === '90days') {
      dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (range === 'year') {
      dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    setLocalFilters(prev => ({
      ...prev,
      dateRangePreset: range,
      date_from: dateFrom,
      date_to: range ? dateTo : undefined
    }));
  };

  const handleApply = () => {
    if (onChange) {
      onChange(localFilters);
    }
  };

  const handleReset = () => {
    const resetFilters = {};
    setLocalFilters(resetFilters);
    if (onChange) {
      onChange(resetFilters);
    }
  };

  // Compile options arrays
  const surveyOptions = [
    { value: "", label: "All Surveys" },
    ...surveys.map(s => ({ value: s.id, label: s.name }))
  ];

  const siteOptions = [
    { value: "", label: "All Sites" },
    ...sites.map(s => ({ value: s.id, label: s.name }))
  ];

  const speciesOptions = [
    { value: "", label: "All Species" },
    ...speciesList.map(s => ({ value: s, label: localizeSpeciesName(s) }))
  ];

  const habitatOptions = [
    { value: "", label: "All Habitats" },
    ...habitats.map(h => ({ value: h, label: h }))
  ];

  const dateOptions = [
    { value: "", label: "All Time" },
    { value: "30days", label: "Last 30 Days" },
    { value: "90days", label: "Last 90 Days" },
    { value: "year", label: "Last Year" }
  ];

  return (
    <div className={`sticky top-16 z-20 glass-card p-4 border-slate-202 dark:border-slate-805 shadow-sm transition-colors duration-300 ${className}`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Filter className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Intelligence Filters</h4>
            <span className="text-[9px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider block mt-0.5">
              {disabled ? 'Offline Mode' : 'Connected to Live DB'}
            </span>
          </div>
        </div>

        {/* Filters Group */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full lg:w-auto flex-1">
          <CustomSelect
            label="Survey"
            placeholder="All Surveys"
            value={localFilters.survey_id || ""}
            onChange={(val) => handleSelectChange('survey_id', val)}
            options={surveyOptions}
            disabled={disabled}
          />
          <CustomSelect
            label="Monitoring Site"
            placeholder="All Sites"
            value={localFilters.site_id || ""}
            onChange={(val) => handleSelectChange('site_id', val)}
            options={siteOptions}
            disabled={disabled}
          />
          <CustomSelect
            label="Species"
            placeholder="All Species"
            value={localFilters.species || ""}
            onChange={(val) => handleSelectChange('species', val)}
            options={speciesOptions}
            disabled={disabled}
          />
          <CustomSelect
            label="Habitat Type"
            placeholder="All Habitats"
            value={localFilters.habitat || ""}
            onChange={(val) => handleSelectChange('habitat', val)}
            options={habitatOptions}
            disabled={disabled}
          />
          <CustomSelect
            label="Date Range"
            placeholder="All Time"
            value={localFilters.dateRangePreset || ""}
            onChange={handleDateRangeChange}
            options={dateOptions}
            disabled={disabled}
          />
        </div>

        {/* Actions Button Group */}
        <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end pt-1 lg:pt-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer disabled:opacity-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={disabled}
            className="px-4.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
