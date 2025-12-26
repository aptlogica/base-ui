import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FIELD_TYPE_OPTIONS } from '../../types/fieldTypes';
import * as Icons from 'lucide-react';


// Add a type for field type option
interface FieldTypeOption {
  value: string;
  label: string;
  icon?: string;
}

const CellTypeModal = ({ onClose, onSubmit }) => {
  const [fieldName, setFieldName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<FieldTypeOption>(FIELD_TYPE_OPTIONS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter field types by search
  const filteredTypes: FieldTypeOption[] = useMemo(
    () =>
      (FIELD_TYPE_OPTIONS as FieldTypeOption[]).filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // if (!fieldName || !selectedType) return;
    onSubmit({
      field: fieldName || "New Column",
      headerName: fieldName || "New Column",
      type: selectedType.value || "singleLineText",
    });
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black opacity-40"></div>
      <div className="fixed top-0 right-0 left-0 z-50 flex justify-center items-center w-full overflow-y-auto overflow-x-hidden md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div className="relative p-4 w-full max-w-md max-h-full">
          <div className="relative bg-card rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t border">
              <h3 className="text-lg font-semibold text-gray-900">
                New Field
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-xl text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              >
                <Icons.X />
              </button>
            </div>
            <form className="p-4 md:p-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 mb-4 grid-cols-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={fieldName}
                    onChange={e => setFieldName(e.target.value)}
                    className="bg-gray-50 border border text-gray-900 text-sm rounded-xl focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    placeholder="Field Name (optional)"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Search Field Type"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="mb-2 bg-gray-50 border border text-gray-900 text-sm rounded-xl focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                    onFocus={() => setDropdownOpen(true)}
                  />
                  <div className="relative" ref={dropdownRef}>
                    <div
                      className="bg-gray-50 border border text-gray-900 text-sm rounded-xl px-3 py-2 cursor-pointer flex items-center justify-between"
                      onClick={() => setDropdownOpen((open) => !open)}
                    >
                      <span>
                        {selectedType.label}
                      </span>
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    {dropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-card border border rounded-xl shadow-lg max-h-48 overflow-auto">
                        {filteredTypes.length === 0 && (
                          <div className="px-4 py-2 text-gray-500">No types found</div>
                        )}
                        {filteredTypes.map((opt:any) => {
                             const IconComponent = Icons[opt.icon];
                            return(
                          <div
                            key={opt.value}
                            className={`px-4 py-2 cursor-pointer hover:bg-blue-100 ${selectedType.value === opt.value ? 'bg-blue-50 font-semibold' : ''}`}
                            onClick={() => {
                              setSelectedType(opt);
                              setDropdownOpen(false);
                            }}
                          >
                            <div className='flex items-center gap-2'>
                                <IconComponent size={18}/> {opt.label}
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="text-primary inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-1 focus:outline-none focus:ring-[var(--color-focus-ring)] font-medium rounded-xl text-sm px-5 py-2.5 text-center"
              >
                Save Field
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CellTypeModal;