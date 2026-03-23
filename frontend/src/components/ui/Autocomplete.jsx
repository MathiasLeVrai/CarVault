import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function Autocomplete({ label, value, options = [], onChange, placeholder = 'Sélectionner...', disabled = false, required = false, allowCustom = false }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        if (allowCustom && open && search.trim() && !value) {
          onChange(search.trim());
        }
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, search, allowCustom, onChange, value]);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
    if (allowCustom && value) {
      setSearch(value);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && allowCustom && search.trim()) {
      e.preventDefault();
      handleSelect(search.trim());
    }
  };

  const showCustomOption = allowCustom && search.trim() &&
    !options.some(opt => opt.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="space-y-2" ref={ref}>
      {label && <label className="block text-sm font-semibold text-white/80">{label}</label>}

      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`cv-input w-full px-4 py-3 text-base text-left flex items-center justify-between gap-2 bg-white/[0.02] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${value ? 'text-white' : 'text-white/40'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-white/40 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {required && <input type="text" value={value || ''} required onChange={() => {}} className="sr-only" tabIndex={-1} />}

      {open && (
        <div className="relative z-50">
          <div className="absolute top-2 left-0 w-full bg-[#121214] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-pop">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <Search className="w-4 h-4 text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={allowCustom ? 'Rechercher ou saisir...' : 'Rechercher...'}
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {showCustomOption && (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-accent/10 transition-colors text-accent border-b border-white/5"
                >
                  Utiliser "<span className="font-bold text-white">{search.trim()}</span>"
                </button>
              )}
              {filtered.length === 0 && !showCustomOption ? (
                <div className="px-4 py-4 text-sm text-white/40 text-center font-medium">Aucun résultat</div>
              ) : (
                filtered.map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/5 transition-colors ${
                      value === opt ? 'bg-accent/10 text-accent font-bold' : 'text-white/80'
                    }`}
                  >
                    {opt}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
