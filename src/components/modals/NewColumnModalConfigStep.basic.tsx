import { Plus, Trash2 } from 'lucide-react';
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import {
  SingleLineText,
  LongText,
  Number,
  Decimal,
  MultiLineText,
} from '../../components/common/Fields';
import { precisionOptions } from '../../types/constants';

export function renderBasicConfigStep(props: any) {
  const {
    selectedType,
    defaultValue,
    setDefaultValue,
    showTextDefault,
    setShowTextDefault,
    showDescription,
    setShowDescription,
    description,
    setDescription,
    richText,
    setRichText,
    showThousands,
    setShowThousands,
    precision,
    setPrecision,
    handleLongtextModalOpen,
    handleLongtextModalClose,
  } = props;

  const handlePrecisionChange = (newPrecision: string | number) => {
    setPrecision(newPrecision);
  };

  switch (selectedType?.key) {
    case 'text':
    case 'uuid':
      return (
        <>
          <div className="mb-3 space-y-2 " >
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]"
              onClick={() => setShowTextDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showTextDefault && (
              <SingleLineText
                value={defaultValue}
                onChange={value => setDefaultValue(value)}
                placeholder="Enter default text"
                isBorder={true}
              />
            )}
          </div>
          <div className="relative">
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
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
    case 'longText':
      return (
        <>
          <div className="mb-3 flex items-center gap-2">
            <input type="checkbox" className="checkbox-primary-brand" id="richText" checked={richText} onChange={e => setRichText(e.target.checked)} />
            <label htmlFor="richText" className="text-sm text-[var(--text-color-secondary)]">Enable rich text</label>
          </div>
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault(v => !v)}>
            <Plus className="w-4 h-4" />
            Set default value
          </button>
          {showTextDefault && (
            <LongText
              value={defaultValue}
              onChange={value => setDefaultValue(value)}
              placeholder="Enter default text value"
              isBorder={true}
              onModalOpen={handleLongtextModalOpen}
              onModalClose={handleLongtextModalClose}
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
    case 'number':
      return (
        <>
          <div className="mb-3 flex items-center gap-2">
            <input type="checkbox" className="checkbox-primary-brand" id="showThousands" checked={showThousands} onChange={e => setShowThousands(e.target.checked)} />
            <label htmlFor="showThousands" className="text-sm text-[var(--text-color-secondary)]" >Show thousands separator</label>
          </div>
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault(v => !v)}>
            <Plus className="w-4 h-4" />
            Set default value
          </button>
          {showTextDefault && (
            <Number
              value={defaultValue}
              onChange={value => setDefaultValue(value?.toString() || '')}
              config={{
                showThousands: showThousands
              }}
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
    case 'decimal':
      return (
        <>
          <div className="mb-2 text-sm font-medium text-[var(--color-gray-700)]">Precision</div>
          <AdvancedDropdown
            options={precisionOptions}
            value={precision}
            onChange={(val) => handlePrecisionChange(val as string)}
          />

          <div className="my-3 flex items-center gap-2">
            <input type="checkbox" className="checkbox-primary-brand" id="showThousands" checked={showThousands} onChange={e => setShowThousands(e.target.checked)} />
            <label htmlFor="showThousands" className="text-sm text-[var(--text-color-secondary)]">Show thousands separator</label>
          </div>
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault(v => !v)}>
            <Plus className="w-4 h-4" />
            Set default value
          </button>
          {showTextDefault && (
            <Decimal
              value={defaultValue ? parseFloat(defaultValue) : null}
              onChange={(value: any) => setDefaultValue(value?.toString() || '')}
              showThousands={showThousands}
              config={{
                precision: typeof precision === 'string' ? (precision.split('.')[1]?.length || 0) : precision,
                defaultValue: defaultValue ? (isNaN(parseFloat(defaultValue)) ? defaultValue : parseFloat(defaultValue)) : undefined
              }}
              isBorder={true}
            />
          )}
          <div className="relative">
            <button className="flex items-center gap-2 text-primarpnewy-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
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
    default:
      return null;
  }
}
