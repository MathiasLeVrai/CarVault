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
        // When closing, if allowCustom and there's typed text, use it as value
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
    // Pre-fill search with current value for easy editing
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

  // Show custom option if search doesn't match any existing option exactly
  const showCustomOption = allowCustom && search.trim() &&
    !options.some(opt => opt.toLowerCase() === search.trim().toLowerCase());

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && <label className="block text-sm font-semibold text-ink">{label}</label>}

      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`cv-input w-full px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${value ? 'text-ink' : 'text-ink-muted'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-ink-faint shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {required && <input type="text" value={value || ''} required onChange={() => {}} className="sr-only" tabIndex={-1} />}

      {open && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 w-full bg-bg-card border border-ink/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden animate-pop">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-ink/10">
              <Search className="w-4 h-4 text-ink-faint shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={allowCustom ? 'Rechercher ou saisir...' : 'Rechercher...'}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {/* Custom value option */}
              {showCustomOption && (
                <button
                  type="button"
                  onClick={() => handleSelect(search.trim())}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-accent/10 transition-colors text-accent border-b border-ink/5"
                >
                  Utiliser "<span className="font-bold">{search.trim()}</span>"
                </button>
              )}
              {filtered.length === 0 && !showCustomOption ? (
                <div className="px-4 py-3 text-sm text-ink-muted text-center">Aucun résultat</div>
              ) : (
                filtered.map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-medium hover:bg-accent/10 transition-colors ${
                      value === opt ? 'bg-accent/10 text-accent font-bold' : 'text-ink'
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
