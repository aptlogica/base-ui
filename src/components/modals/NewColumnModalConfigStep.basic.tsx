import { Plus } from 'lucide-react';
import { renderDescriptionToggle } from './NewColumnModalConfigStep';

import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import {
  SingleLineText,
  LongText,
  Number,
  Decimal,
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
              onClick={() => setShowTextDefault((v: boolean) => !v)}>
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
          {renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2',
            wrapperClassName: 'relative',
          })}
        </>
      );
    case 'longText':
      return (
        <>
          <div className="mb-3 flex items-center gap-2">
            <input type="checkbox" className="checkbox-primary-brand" id="richText" checked={richText} onChange={e => setRichText(e.target.checked)} />
            <label htmlFor="richText" className="text-sm text-[var(--text-color-secondary)]">Enable rich text</label>
          </div>
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault((v: boolean) => !v)}>
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
          {renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2',
            wrapperClassName: 'relative',
          })}
        </>
      );
    case 'number':
      return (
        <>
          <div className="mb-3 flex items-center gap-2">
            <input type="checkbox" className="checkbox-primary-brand" id="showThousands" checked={showThousands} onChange={e => setShowThousands(e.target.checked)} />
            <label htmlFor="showThousands" className="text-sm text-[var(--text-color-secondary)]" >Show thousands separator</label>
          </div>
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault((v: boolean) => !v)}>
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
          {renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2',
            wrapperClassName: 'relative',
          })}
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
          <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2" onClick={() => setShowTextDefault((v: boolean) => !v)}>
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
          {renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2',
            wrapperClassName: 'relative',
          })}
        </>
      );
    default:
      return null;
  }
}
