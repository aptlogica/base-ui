import { Plus, Trash2 } from 'lucide-react';
import { DateField, Time, Year, MultiLineText } from '../../components/common/Fields';
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import { convertDateFormat } from '../../utils/helpers';
import { dateFormatOptions } from '../../types/constants';

export function renderDateTimeConfigStep(props: any) {
  const {
    selectedType,
    dateFormat,
    setDateFormat,
    showDateDefault,
    setShowDateDefault,
    dateDefault,
    setDateDefault,
    showDescription,
    setShowDescription,
    description,
    setDescription,
    showYearDefault,
    setShowYearDefault,
    yearDefault,
    setYearDefault,
    hourFormat,
    setHourFormat,
    showTimeDefault,
    setShowTimeDefault,
    timeDefault,
    setTimeDefault,
  } = props;

  const handleDateChange = (value: any) => {
    if (value) {
      setDateDefault(value);
    }
  };

  const handleYearChange = (value: number | null | string) => {
    if (typeof value === 'number') {
      setYearDefault(value);
    } else if (value === null || value === '') {
      setYearDefault(null);
    } else {
      const parsedValue = Number.parseInt(value);
      setYearDefault(Number.isNaN(parsedValue) ? null : parsedValue);
    }
  };

  const formatDefaultDate = (date: any) => {
    if (date) {
      const currentFormat = dateFormat;
      return convertDateFormat(date, currentFormat, dateFormat);
    }
    return '';
  };

  switch (selectedType?.key) {
    case 'date':
      return (
        <>
          <div className="mb-3 space-y-2">
            <div className="mb-3">
              <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Date format</div>
              <AdvancedDropdown
                options={dateFormatOptions}
                value={dateFormat}
                onChange={(val) => setDateFormat(val as string)}
              />
            </div>
            <div>
              <button
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-2 space-y-2"
                onClick={() => setShowDateDefault(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showDateDefault && (
                <DateField
                  value={formatDefaultDate(dateDefault)}
                  onChange={handleDateChange}
                  format={dateFormat}
                  isBorder={true}
                />
              )}
            </div>
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
              <Plus className="w-4 h-4" />
              Add description
            </button>
            {showDescription && (
              <>
                <MultiLineText
                  placeholder="Enter field description..."
                  value={description}
                  onChange={value => setDescription(value)}
                  rows={4}
                  isBorder={true}
                />
                {description &&
                  <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                }
              </>
            )}
          </div>
        </>
      );
    case 'year':
      return (
        <>
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowYearDefault(v => !v)}>
            <Plus className="w-4 h-4" />
            Set default value
          </button>
          {showYearDefault && (
            <Year
              value={yearDefault}
              onChange={handleYearChange}
              isBorder={true}
            />
          )}
          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
              <Plus className="w-4 h-4" />
              Add description
            </button>
            {showDescription && (
              <>
                <MultiLineText
                  placeholder="Enter field description..."
                  value={description}
                  onChange={value => setDescription(value)}
                  rows={4}
                  isBorder={true}
                />
                {description && (
                  <button className="absolute right-2 top-2 text-gray-400 hover:text-gray-600" onClick={() => setDescription('')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    case 'time':
      return (
        <>
          <div className="">
            <div>
              <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Time Display</div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <label className={`flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '12' ?
                  'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]' : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}>
                  <input
                    type="radio"
                    className="hidden"
                    checked={hourFormat === '12'}
                    onChange={() => setHourFormat('12')}
                  />12 Hrs</label>
                <label className={`flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '24' ?
                  'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]' : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}>
                  <input
                    type="radio"
                    className="hidden"
                    checked={hourFormat === '24'}
                    onChange={() => setHourFormat('24')}
                  />24 Hrs</label>
              </div>
            </div>

            <div>
              <button
                className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2"
                onClick={() => setShowTimeDefault(v => !v)}
              >
                <Plus className="w-4 h-4" />
                Set default value
              </button>
              {showTimeDefault && (
                <div className="mt-2">
                  <Time
                    value={timeDefault}
                    onChange={setTimeDefault}
                    config={{
                      hourFormat: hourFormat,
                    }}
                    isBorder={true}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
              <Plus className="w-4 h-4" />
              Add description
            </button>
            {showDescription && (
              <>
                <MultiLineText
                  placeholder="Enter field description..."
                  value={description}
                  onChange={value => setDescription(value)}
                  rows={4}
                  isBorder={true}
                />
                {description && (
                  <button
                    className="absolute right-2 top-0 text-gray-400 hover:text-gray-600 text-sm"
                    onClick={() => setDescription('')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </>
      );
    default:
      return null;
  }
}
