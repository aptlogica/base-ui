import React from 'react';
import {
  Plus, Square, Check, Star, Heart, ThumbsUp, ThumbsDown, Flag, Circle, CheckCircle, BadgeCheck, ShieldCheck, Award, Trophy, Medal, Zap, Sparkles, Crown, Gem, Diamond, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';

import Dropdown from '../../plugins/GridViewPlugin/components/shared/DropDown/DropDown';
import { DateTime, Duration, JSONField, User, Currency, MultiLineText, Formula } from '../../components/common/Fields';
import AdvancedDropdown from '../../components/common/dropdown/AdvancedDropdown';
import {
  ratingColorOptions, precisionOptions,
  currencyOptions,
  currencyLocaleOptions,
  progressColorOptions,
  durationFormatOptions,
  dateFormatOptions,
  timeFormatOptions,
  timeZoneOptions,
} from '../../types/constants';
import { renderBasicConfigStep } from './NewColumnModalConfigStep.basic';
import { renderDateTimeConfigStep } from './NewColumnModalConfigStep.dateTime';
import { renderContactConfigStep } from './NewColumnModalConfigStep.contact';
import { renderRelationsConfigStep } from './NewColumnModalConfigStep.relations';

export { renderDescriptionToggle };

function renderDescriptionToggle({
  showDescription,
  setShowDescription,
  description,
  setDescription,
  buttonClassName = 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2',
  wrapperClassName = 'relative',
  clearButtonClassName = 'absolute right-2 top-2 text-gray-400 hover:text-gray-600',
}: {
  showDescription: boolean;
  setShowDescription: (value: boolean | ((prev: boolean) => boolean)) => void;
  description: string;
  setDescription: (value: string) => void;
  buttonClassName?: string;
  wrapperClassName?: string;
  clearButtonClassName?: string;
}) {
  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setShowDescription((v: boolean) => !v)}
      >
        <Plus className="w-4 h-4" />
        Add description
      </button>
      {showDescription && (
        <>
          <MultiLineText
            placeholder="Enter field description..."
            value={description}
            onChange={(value) => setDescription(value)}
            rows={4}
            isBorder={true}
          />
          {description && (
            <button
              type="button"
              className={clearButtonClassName}
              onClick={() => setDescription('')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function renderNewColumnConfigStep(props: any) {
  const {
    selectedType,
    defaultValue,
    setDefaultValue,
    description,
    setDescription,
    richText,
    setRichText,
    showThousands,
    setShowThousands,
    precision,
    setPrecision,
    checkboxIcon,
    setCheckboxIcon,
    checkboxColor,
    setCheckboxColor,
    checkboxDefault,
    setCheckboxDefault,
    selectOptions,
    setSelectOptions,
    color,
    setColor,
    newOption,
    setNewOption,
    multiDefault,
    setMultiDefault,
    singleDefault,
    setSingleDefault,
    editingOptionIndex,
    setEditingOptionIndex,
    editingOptionValue,
    setEditingOptionValue,
    optionError,
    setOptionError,
    dateFormat,
    setDateFormat,
    dateDefault,
    setDateDefault,
    showDateDefault,
    setShowDateDefault,
    yearDefault,
    setYearDefault,
    showYearDefault,
    setShowYearDefault,
    timeFormat,
    setTimeFormat,
    timeDefault,
    setTimeDefault,
    showTimeDefault,
    setShowTimeDefault,
    hourFormat,
    setHourFormat,
    displayTimeZone,
    setDisplayTimeZone,
    sameTimezone,
    setSameTimezone,
    timeZone,
    setTimeZone,
    dateTimeDefault,
    setDateTimeDefault,
    showDateTimeDefault,
    setShowDateTimeDefault,
    phoneValid,
    setPhoneValid,
    phoneDefault,
    setPhoneDefault,
    showPhoneDefault,
    setShowPhoneDefault,
    emailValid,
    setEmailValid,
    emailDefault,
    setEmailDefault,
    showEmailDefault,
    setShowEmailDefault,
    urlValid,
    setUrlValid,
    urlDefault,
    setUrlDefault,
    showUrlDefault,
    setShowUrlDefault,
    displayAsProgress,
    setDisplayAsProgress,
    progressColor,
    setProgressColor,
    showPercentDefault,
    setShowPercentDefault,
    percentDefault,
    setPercentDefault,
    durationFormat,
    setDurationFormat,
    showDurationDefault,
    setShowDurationDefault,
    durationDefault,
    setDurationDefault,
    currencyType,
    setCurrencyType,
    currencyLocale,
    setCurrencyLocale,
    showCurrencyDefault,
    setShowCurrencyDefault,
    currencyDefault,
    setCurrencyDefault,
    ratingIcon,
    setRatingIcon,
    ratingColor,
    setRatingColor,
    ratingMax,
    setRatingMax,
    ratingDefault,
    setRatingDefault,
    showRatingDefault,
    setShowRatingDefault,
    ratingDefaultHover,
    setRatingDefaultHover,
    allowMultipleUsers,
    setAllowMultipleUsers,
    showUserDefault,
    setShowUserDefault,
    selectedUsers,
    setSelectedUsers,
    relationType,
    setRelationType,
    selectedTableId,
    setSelectedTableId,
    selectedTable,
    setSelectedTable,
    selectedRelationId,
    setSelectedRelationId,
    selectedLookupColumnId,
    setSelectedLookupColumnId,
    setHasUserModifiedLookupColumn,
    formulaText,
    setFormulaText,
    formulaFormatting,
    showJsonDefault,
    setShowJsonDefault,
    showTextDefault,
    setShowTextDefault,
    showDescription,
    setShowDescription,
    showIconDropdown,
    setShowIconDropdown,
    showColorDropdown,
    setShowColorDropdown,
    showRatingIconDropdown,
    setShowRatingIconDropdown,
    showRatingColorDropdown,
    setShowRatingColorDropdown,
    fields,
    tables,
    linkFields,
    targetTableFields,
    isTargetTableLoading,
    getOptionColor,
    editInputRef,
    handleLongtextModalOpen,
    handleLongtextModalClose,
    setFormulaError,
    isValidPercentInput,
    isLinksFieldEditing,
  } = props;
  const handleJsonChange = (value: any) => {
    const stringify = JSON.stringify(value, null, 2);
    setDefaultValue(stringify);
  };

  // Handle precision change - components will handle their own formatting
  const handlePrecisionChange = (newPrecision: string | number) => {
    setPrecision(newPrecision);
  };

  // Prevent duplicate React keys in dropdown options when constants contain repeated values.
  const getUniqueDropdownOptions = (options: Array<{ label?: string; value?: string }>) => {
    const seen = new Set<string>();
    return options.filter((option) => {
      const key = String(option?.value ?? option?.label ?? '');
      if (!key || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  };

  const uniqueCurrencyLocaleOptions = getUniqueDropdownOptions(currencyLocaleOptions);
  const uniqueCurrencyOptions = getUniqueDropdownOptions(currencyOptions);
  const currencySymbolByType: Record<string, string> = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    JPY: '\u00A5',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '\u00A5',
    INR: '\u20B9',
    BRL: 'R$',
  };

  const renderDefaultValueToggle = ({
    show,
    setShow,
    children,
    label = 'Set default value',
    buttonClassName = 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2',
    wrapperClassName = '',
  }: {
    show: boolean;
    setShow: (value: boolean | ((prev: boolean) => boolean)) => void;
    children: React.ReactNode;
    label?: string;
    buttonClassName?: string;
    wrapperClassName?: string;
  }) => (
    <div className={wrapperClassName}>
      <button
        type="button"
        className={buttonClassName}
        onClick={() => setShow((v: boolean) => !v)}
      >
        <Plus className="w-4 h-4" />
        {label}
      </button>
      {show && children}
    </div>
  );

  const renderHourFormatToggle = ({
    hourFormat,
    setHourFormat,
    wrapperClassName = 'grid grid-cols-2 gap-4 mb-2',
  }: {
    hourFormat: '12' | '24';
    setHourFormat: (value: '12' | '24') => void;
    wrapperClassName?: string;
  }) => (
    <div className={wrapperClassName}>
      <label
        className={`flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '12'
          ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
          : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}
      >
        <input
          type="radio"
          className="hidden"
          checked={hourFormat === '12'}
          onChange={() => setHourFormat('12')}
        />12 Hrs
      </label>
      <label
        className={`flex items-center px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] cursor-pointer transition-colors ${hourFormat === '24'
          ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
          : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'}`}
      >
        <input
          type="radio"
          className="hidden"
          checked={hourFormat === '24'}
          onChange={() => setHourFormat('24')}
        />24 Hrs
      </label>
    </div>
  );

  // Config step for each type
  function renderConfigStep() {
    const basicConfig = renderBasicConfigStep({
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
    });
    if (basicConfig) return basicConfig;
    const dateTimeConfig = renderDateTimeConfigStep({
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
    });
    if (dateTimeConfig) return dateTimeConfig;
    const contactConfig = renderContactConfigStep({
      selectedType,
      phoneValid,
      setPhoneValid,
      showPhoneDefault,
      setShowPhoneDefault,
      phoneDefault,
      setPhoneDefault,
      showDescription,
      setShowDescription,
      description,
      setDescription,
      emailValid,
      setEmailValid,
      showEmailDefault,
      setShowEmailDefault,
      emailDefault,
      setEmailDefault,
      urlValid,
      setUrlValid,
      showUrlDefault,
      setShowUrlDefault,
      urlDefault,
      setUrlDefault,
    });
    if (contactConfig) return contactConfig;
    const relationsConfig = renderRelationsConfigStep({
      selectedType,
      isLinksFieldEditing,
      relationType,
      setRelationType,
      tables,
      selectedTableId,
      setSelectedTableId,
      selectedTable,
      setSelectedTable,
      showDescription,
      setShowDescription,
      description,
      setDescription,
      linkFields,
      targetTableFields,
      selectedRelationId,
      setSelectedRelationId,
      selectedLookupColumnId,
      setSelectedLookupColumnId,
      setHasUserModifiedLookupColumn,
      isTargetTableLoading,
    });
    if (relationsConfig) return relationsConfig;

    switch (selectedType?.key) {
      case 'boolean':
        {
          const iconOptions: { key: string; label: string; checkedIcon: any; uncheckedIcon: any }[] = [
            {
              key: 'check',
              label: 'Check',
              checkedIcon: (
                <div className="w-4 h-4 rounded flex items-center justify-center bg-green-500 border-green-500">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
              ),
              uncheckedIcon: (
                <div className="w-4 h-4 rounded flex items-center justify-center">
                  <Square className="w-4 h-4 text-gray-400" />
                </div>
              )
            },
            {
              key: 'circle',
              label: 'Circle',
              checkedIcon: (
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-green-500 border-green-500">
                  <Check className="w-2.5 h-2.5 text-primary" />
                </div>
              ),
              uncheckedIcon: (
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                  <Circle className="w-4 h-4 text-gray-400" />
                </div>
              )
            },
            {
              key: 'star',
              label: 'Star',
              checkedIcon: <Star className="w-4 h-4 text-yellow-500 fill-current" />,
              uncheckedIcon: <Star className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'heart',
              label: 'Heart',
              checkedIcon: <Heart className="w-4 h-4 text-red-500 fill-current" />,
              uncheckedIcon: <Heart className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'thumb',
              label: 'Thumb',
              checkedIcon: <ThumbsUp className="w-4 h-4 text-green-500 fill-current" />,
              uncheckedIcon: <ThumbsDown className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'flag',
              label: 'Flag',
              checkedIcon: <Flag className="w-4 h-4 text-red-500 fill-current" />,
              uncheckedIcon: <Flag className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'badge',
              label: 'Badge',
              checkedIcon: <BadgeCheck className="w-4 h-4 text-blue-500 fill-current" />,
              uncheckedIcon: <BadgeCheck className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'shield',
              label: 'Shield',
              checkedIcon: <ShieldCheck className="w-4 h-4 text-purple-500 fill-current" />,
              uncheckedIcon: <ShieldCheck className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'award',
              label: 'Award',
              checkedIcon: <Award className="w-4 h-4 text-orange-500 fill-current" />,
              uncheckedIcon: <Award className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'trophy',
              label: 'Trophy',
              checkedIcon: <Trophy className="w-4 h-4 text-yellow-500 fill-current" />,
              uncheckedIcon: <Trophy className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'medal',
              label: 'Medal',
              checkedIcon: <Medal className="w-4 h-4 text-amber-500 fill-current" />,
              uncheckedIcon: <Medal className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'crown',
              label: 'Crown',
              checkedIcon: <Crown className="w-4 h-4 text-yellow-500 fill-current" />,
              uncheckedIcon: <Crown className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'gem',
              label: 'Gem',
              checkedIcon: <Gem className="w-4 h-4 text-purple-500 fill-current" />,
              uncheckedIcon: <Gem className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'diamond',
              label: 'Diamond',
              checkedIcon: <Diamond className="w-4 h-4 text-blue-500 fill-current" />,
              uncheckedIcon: <Diamond className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'zap',
              label: 'Zap',
              checkedIcon: <Zap className="w-4 h-4 text-yellow-500 fill-current" />,
              uncheckedIcon: <Zap className="w-4 h-4 text-gray-400" />
            },
            {
              key: 'sparkles',
              label: 'Sparkles',
              checkedIcon: <Sparkles className="w-4 h-4 text-pink-500 fill-current" />,
              uncheckedIcon: <Sparkles className="w-4 h-4 text-gray-400" />
            },
          ];

          // Checkbox color options
          const colorOptions: { key: string; label: string; className: string; color: string; bgClass: string }[] = [
            { key: 'green', label: 'Green', className: 'text-green-600', color: 'green', bgClass: 'bg-green-500' },
            { key: 'blue', label: 'Blue', className: 'text-blue-600', color: 'blue', bgClass: 'bg-blue-500' },
            { key: 'yellow', label: 'Yellow', className: 'text-yellow-500', color: 'yellow', bgClass: 'bg-yellow-400' },
            { key: 'red', label: 'Red', className: 'text-red-600', color: 'red', bgClass: 'bg-red-500' },
            { key: 'purple', label: 'Purple', className: 'text-purple-600', color: 'purple', bgClass: 'bg-purple-500' },
            { key: 'gray', label: 'Gray', className: 'text-gray-600', color: 'gray', bgClass: 'bg-gray-500' },
          ];

          const selectedIconOption = iconOptions.find(opt => opt.key === checkboxIcon) || iconOptions[0];
          const selectedColorOption = colorOptions.find(opt => opt.key === checkboxColor) || colorOptions[0];

          return (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Icon Selection */}
                <div>
                  <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Icon</div>
                  <div className="relative icon-dropdown">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] flex items-center justify-between"
                      onClick={() => setShowIconDropdown((v: boolean) => !v)}
                    >
                      <div className="flex items-center gap-2">
                        {selectedIconOption.checkedIcon}
                        {selectedIconOption.uncheckedIcon}
                        <span>{selectedIconOption.label}</span>
                      </div>
                      {showIconDropdown ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                    </button>

                    {showIconDropdown && (
                      <div className="absolute p-2 space-y-1 top-full left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                        {iconOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            className={`w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${checkboxIcon === option.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''
                              }`}
                            onClick={() => {
                              setCheckboxIcon(option.key);
                              setShowIconDropdown(false);
                            }}
                          >
                            {option.checkedIcon}
                            {option.uncheckedIcon}
                            <span>{option.label}</span>
                            {checkboxIcon === option.key && (
                              <Check className="w-4 h-4 ml-auto text-black" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Selection */}
                <div>
                  <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Colour</div>
                  <div className="relative color-dropdown">
                    <button
                      type="button"
                      className="w-full px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)] flex items-center justify-between"
                      onClick={() => setShowColorDropdown((v: boolean) => !v)}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full ${selectedColorOption.bgClass}`}></div>
                        <span>{selectedColorOption.label}</span>
                      </div>
                      {showColorDropdown ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                    </button>

                    {showColorDropdown && (
                      <div className="absolute p-2 space-y-1 top-full left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                        {colorOptions.map((color) => (
                          <button
                            key={color.key}
                            type="button"
                            className={`w-full px-3 py-2 rounded-xl text-left hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${checkboxColor === color.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''
                              }`}
                            onClick={() => {
                              setCheckboxColor(color.key);
                              setShowColorDropdown(false);
                            }}
                          >
                            <div className={`w-4 h-4 rounded-full ${color.bgClass}`}></div>
                            <span>{color.label}</span>
                            {checkboxColor === color.key && (
                              <Check className="w-4 h-4 ml-auto text-black" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Default Value - Full Width */}
              <div className="mb-4">
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Default value</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] flex items-center gap-2 ${checkboxDefault
                      ? 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
                      : 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'
                      }`}
                    onClick={() => setCheckboxDefault(true)}
                  >
                    {selectedIconOption.checkedIcon}
                    <span>Checked</span>
                  </button>
                  <button
                    type="button"
                    className={`px-3 py-2 border rounded-xl text-sm text-[var(--color-text-tertiary)] flex items-center gap-2 ${checkboxDefault
                      ? 'border-[var(--color-gray-300)] hover:border-[var(--color-gray-400)]'
                      : 'border-[var(--color-focus-ring)] bg-[var(--color-gray-100)] text-[var(--color-gray-100)]'
                      }`}
                    onClick={() => setCheckboxDefault(false)}
                  >
                    {selectedIconOption.uncheckedIcon}
                    <span>Unchecked</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="relative">
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] my-3 space-y-2">Description</div>
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
              </div>
            </>
          );
        }
      case 'multiSelect':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Options</div>
            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-3 py-2 border border-[var(--color-gray-300)] bg-[var(--color-alpha-white)] text-[var(--color-gray-900)] rounded-xl text-sm outline-none field-component-focus"
                placeholder="Add option"
                value={newOption}
                onChange={e => {
                  setNewOption(e.target.value);
                  if (optionError) setOptionError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());
                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      const optionColor = color && color !== '#cccccc' ? color : getOptionColor();
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: optionColor }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              />
              <button
                type="button"
                className="px-3 py-1 btn-add-option text-sm"
                onClick={() => {
                  if (newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());
                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      const optionColor = color && color !== '#cccccc' ? color : getOptionColor();
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: optionColor }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              >
                Add option
              </button>
            </div>
            {optionError && <div className="text-red-500 text-xs mt-1 mb-3">{optionError}</div>}

            {selectOptions.length > 0 &&
              <>
                <span className='text-primary'>Select Default Value</span>
                <div className="flex flex-col gap-1 my-2 max-w-full border border-primary rounded-xl p-2 group max-h-48 overflow-auto">
                  {selectOptions.map((opt, idx) => (
                    <div key={`multi-${opt.option}-${opt.color || 'none'}`} className="relative flex items-center gap-2 min-w-0 hover:bg-[var(--color-hover-bg)] rounded-xl px-1">
                      <input
                        type="checkbox"
                        checked={multiDefault.includes(opt.option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setMultiDefault([...multiDefault, opt.option]);
                          } else {
                            setMultiDefault(multiDefault.filter(v => v !== opt.option));
                          }
                        }}
                        className="checkbox-primary-brand"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="color"
                        value={opt.color || '#cccccc'}
                        onChange={(e) => {
                          const newOptions = [...selectOptions];
                          newOptions[idx] = { ...newOptions[idx], color: e.target.value };
                          setSelectOptions(newOptions);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="color-input"
                      />
                      {editingOptionIndex === idx ? (
                        <input
                          ref={editInputRef}
                          className='flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] bg-[--color-alpha-white] border border-[var(--color-gray-300)] text-xs min-w-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]'
                          value={editingOptionValue}
                          onChange={(e) => setEditingOptionValue(e.target.value)}
                          onBlur={() => {
                            const trimmedValue = editingOptionValue.trim();
                            if (trimmedValue && trimmedValue !== opt.option) {
                              const newOptions = [...selectOptions];
                              newOptions[idx] = { ...newOptions[idx], option: trimmedValue };
                              setSelectOptions(newOptions);

                              // Update default values if this option was selected
                              if (multiDefault.includes(opt.option)) {
                                setMultiDefault(multiDefault.map(v => v === opt.option ? trimmedValue : v));
                              }
                            }
                            setEditingOptionIndex(null);
                            setEditingOptionValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingOptionIndex(null);
                              setEditingOptionValue('');
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span //NOSONAR
                          className="flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] text-xs truncate min-w-0 cursor-pointer"
                          onClick={() => {
                            setEditingOptionIndex(idx);
                            setEditingOptionValue(opt.option);
                          }}
                        >
                          {opt.option}
                        </span>
                      )}
                      <button
                        type="button"
                        className="h-8 w-8 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectOptions(selectOptions.filter((o, i) => i !== idx));
                          // Remove from defaults if this option was selected
                          if (multiDefault.includes(opt.option)) {
                            setMultiDefault(multiDefault.filter(v => v !== opt.option));
                          }
                        }}
                      >
                        <Trash2 className='w-4 h-4 text-[var(--color-error-400)]' />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            }

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <div className="mb-3 relative">
                    <MultiLineText
                      placeholder="Enter field description..."
                      value={description}
                      onChange={value => setDescription(value)}
                      rows={4}
                      isBorder={true}
                    />
                  </div>
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
      case 'select':
        return (
          <>
            <div className="flex gap-2 mb-3 w-full">
              <input
                className="flex-1 px-3 py-2 border border-[var(--color-gray-300)] bg-[var(--color-alpha-white)] text-[var(--color-gray-900)] rounded-xl text-sm outline-none field-component-focus"
                placeholder="Add option"
                value={newOption}
                onChange={e => {
                  setNewOption(e.target.value);
                  if (optionError) setOptionError('');
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());
                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      const optionColor = color && color !== '#cccccc' ? color : getOptionColor();
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: optionColor }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              />

              <button
                type="button"
                className="px-3 py-1 btn-add-option"
                onClick={() => {
                  if (newOption.trim()) {
                    const trimmed = newOption.trim();
                    const exists = selectOptions.some(opt => opt.option.toLowerCase() === trimmed.toLowerCase());

                    if (exists) {
                      setOptionError('Option already exists');
                    } else {
                      const optionColor = color && color !== '#cccccc' ? color : getOptionColor();
                      setSelectOptions([
                        ...selectOptions,
                        { option: trimmed, color: optionColor }
                      ]);
                      setColor('');
                      setNewOption('');
                      setOptionError('');
                    }
                  }
                }}
              >
                Add option
              </button>
            </div>
            {optionError && <div className="text-red-500 text-xs mt-1">{optionError}</div>}
            {selectOptions.length > 0 &&
              <>
                <div className="m-2 text-sm font-medium text-[var(--color-text-tertiary)]">Select Default value</div>
                <div className="flex flex-col gap-1 mb-2 max-w-full border border-primary rounded-xl p-2 group max-h-48 overflow-auto">
                  {selectOptions.map((opt, idx) => (
                    <div key={`single-${opt.option}-${opt.color || 'none'}`} className="relative flex items-center gap-2 min-w-0 hover:bg-[var(--color-hover-bg)] rounded-xl px-1">
                      <input
                        type="radio"
                        className="flex-shrink-0 checkbox-primary-brand"
                        checked={singleDefault === opt.option}
                        onChange={() => {}}
                        onClick={() => {
                          // Toggle on click - if already selected, deselect; otherwise select
                          if (singleDefault === opt.option) {
                            setSingleDefault('');
                          } else {
                            setSingleDefault(opt.option);
                          }
                        }}
                      />
                      <input
                        type="color"
                        value={opt.color || '#cccccc'}
                        onChange={(e) => {
                          const newOptions = [...selectOptions];
                          newOptions[idx] = { ...newOptions[idx], color: e.target.value };
                          setSelectOptions(newOptions);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="color-input"
                      />

                      {editingOptionIndex === idx ? (
                        <input
                          ref={editInputRef}
                          className='flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] bg-[--color-alpha-white] text-xs min-w-0 focus:outline-none focus:ring-1 focus:ring-[var(--color-focus-ring)]'
                          value={editingOptionValue}
                          onChange={(e) => setEditingOptionValue(e.target.value)}
                          onBlur={() => {
                            const trimmedValue = editingOptionValue.trim();
                            if (trimmedValue && trimmedValue !== opt.option) {
                              const newOptions = [...selectOptions];
                              newOptions[idx] = { ...newOptions[idx], option: trimmedValue };
                              setSelectOptions(newOptions);

                              // Update default value if this option was selected
                              if (singleDefault === opt.option) {
                                setSingleDefault(trimmedValue);
                              }
                            }
                            setEditingOptionIndex(null);
                            setEditingOptionValue('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            } else if (e.key === 'Escape') {
                              setEditingOptionIndex(null);
                              setEditingOptionValue('');
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span //NOSONAR
                          className="flex-1 px-2 py-2.5 rounded-xl text-[var(--color-text-secondary)] text-xs truncate min-w-0 cursor-pointer"
                          onClick={() => {
                            setEditingOptionIndex(idx);
                            setEditingOptionValue(opt.option);
                          }}
                        >
                          {opt.option}
                        </span>
                      )}
                      <button
                        type="button"
                        className=" h-8 w-8 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectOptions(selectOptions.filter((o, i) => i !== idx));
                          // Clear default if this option was selected
                          if (singleDefault === opt.option) {
                            setSingleDefault('');
                          }
                        }}
                      >
                        <Trash2 className='w-4 h-4 text-[var(--color-error-400)]' />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            }

            <div className="relative">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDescription(v => !v)}>
                <Plus className="w-4 h-4" />
                Add description
              </button>
              {showDescription && (
                <>
                  <div className="mb-3 relative">
                    <MultiLineText
                      placeholder="Enter field description..."
                      value={description}
                      onChange={value => setDescription(value)}
                      rows={4}
                      isBorder={true}
                    />
                  </div>
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
      case 'percent':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <label className="relative inline-flex gap-3 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayAsProgress}
                  onChange={e => setDisplayAsProgress(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-1 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                <span className="text-sm font-medium text-[var(--color-text-tertiary)]">Display as progress</span>
              </label>
            </div>

            {displayAsProgress && (
              <>
                <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Progress color</div>
                <AdvancedDropdown
                  options={progressColorOptions}
                  value={progressColor}
                  onChange={(val: any) => setProgressColor(val as string)}
                  placeholder="Select progress color"
                />
              </>
            )}
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowPercentDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showPercentDefault && (
              <input
                type="text"
                className="field-component field-component-border field-component-focus"
                placeholder="Enter default percentage"
                value={percentDefault?.toString() || ''}
                onChange={e => {
                  const value = e.target.value;
                  if (isValidPercentInput(value)) {
                    const numericValue = Number.parseFloat(value);
                    if (numericValue >= 0 && numericValue <= 100) {
                      setPercentDefault(numericValue);
                    }
                  }
                }}
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
      case 'currency':
        return (
          <>
            <div className='flex gap-2 mb-2'>
              <div className='flex-1'>
                <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Currency Locale</div>
                <AdvancedDropdown
                  options={uniqueCurrencyLocaleOptions}
                  value={currencyLocale}
                  onChange={(val) => setCurrencyLocale(val as string)}
                  placeholder="Select Locale"
                  searchable={true}
                />
              </div>
              <div className='flex-1'>
                <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Currency Code</div>
                <AdvancedDropdown
                  options={uniqueCurrencyOptions}
                  value={currencyType}
                  onChange={(val) => setCurrencyType(val as string)}
                  placeholder="Select Currency"
                  searchable={true}
                />
              </div>
            </div>
            <div className="mb-4 text-xs text-gray-600">
              Selected currency : {currencySymbolByType[currencyType] || currencyType}
            </div>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Precision</div>
            <AdvancedDropdown
              options={precisionOptions}
              value={precision}
              onChange={(val) => handlePrecisionChange(val as string)}
              placeholder="Select precision"
              clearable
            />
            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowCurrencyDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>
            {showCurrencyDefault && (
              <Currency
                value={currencyDefault}
                onChange={(value: any) => setCurrencyDefault(value)}
                config={{
                  currencyType: currencyType,
                  currencyLocale: currencyLocale,
                  precision: typeof precision === 'string' ? (precision.split('.')[1]?.length || 0) : precision,
                  defaultValue: currencyDefault?.toString() || ''
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
      case 'duration':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Format</div>
            <AdvancedDropdown
              options={durationFormatOptions}
              value={durationFormat}
              onChange={(val) => setDurationFormat(val as string)}
            />

            <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] my-3 space-y-2" onClick={() => setShowDurationDefault(v => !v)}>
              <Plus className="w-4 h-4" />
              Set default value
            </button>

            {showDurationDefault && (
              <Duration
                value={durationDefault}
                onChange={(value) => setDurationDefault(value)}
                isBorder={true}
                config={{
                  durationFormat: durationFormat as "h:mm" | "h:mm:ss" | "h:mm:ss.s" | "h:mm:ss.ss" | "h:mm:ss.sss" | "d:h:mm" | undefined,
                }}
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
      case 'rating': {
        const ratingIconOptions = [
          { key: 'star', label: 'Star', icon: <Star className="w-4 h-4" /> },
          { key: 'heart', label: 'Heart', icon: <Heart className="w-4 h-4" /> },
          { key: 'circle', label: 'Circle', icon: <Circle className="w-4 h-4" /> },
          { key: 'thumb', label: 'Thumb', icon: <ThumbsUp className="w-4 h-4" /> },
          { key: 'flag', label: 'Flag', icon: <Flag className="w-4 h-4" /> },
          { key: 'check', label: 'Check', icon: <CheckCircle className="w-4 h-4" /> },
          { key: 'badge', label: 'Badge', icon: <BadgeCheck className="w-4 h-4" /> },
          { key: 'shield', label: 'Shield', icon: <ShieldCheck className="w-4 h-4" /> },
          { key: 'award', label: 'Award', icon: <Award className="w-4 h-4" /> },
          { key: 'trophy', label: 'Trophy', icon: <Trophy className="w-4 h-4" /> },
          { key: 'medal', label: 'Medal', icon: <Medal className="w-4 h-4" /> },
          { key: 'zap', label: 'Zap', icon: <Zap className="w-4 h-4" /> },
          { key: 'sparkles', label: 'Sparkles', icon: <Sparkles className="w-4 h-4" /> },
          { key: 'crown', label: 'Crown', icon: <Crown className="w-4 h-4" /> },
          { key: 'gem', label: 'Gem', icon: <Gem className="w-4 h-4" /> },
          { key: 'diamond', label: 'Diamond', icon: <Diamond className="w-4 h-4" /> },
        ];

        const selectedRatingIconOption = ratingIconOptions.find(opt => opt.key === ratingIcon) || ratingIconOptions[0];
        const selectedRatingColorOption = ratingColorOptions.find(opt => opt.key === ratingColor) || ratingColorOptions[0];
        const ratingFillClassByColor: Record<string, string> = {
          yellow: 'text-yellow-400 fill-yellow-400',
          blue: 'text-blue-400 fill-blue-400',
          red: 'text-red-400 fill-red-400',
          green: 'text-green-400 fill-green-400',
          purple: 'text-purple-400 fill-purple-400',
          pink: 'text-pink-400 fill-pink-400',
          orange: 'text-orange-400 fill-orange-400',
          indigo: 'text-indigo-400 fill-indigo-400',
          teal: 'text-teal-400 fill-teal-400',
          gray: 'text-gray-400 fill-gray-400',
        };
        const selectedRatingFillClass = ratingFillClassByColor[ratingColor] || ratingFillClassByColor.yellow;

        // Helper to render icons for preview - with fill support for filled icons
        const getIcon = (icon: string, isFilled: boolean = false) => {
          const iconProps = {
            className: "w-5 h-5",
            fill: isFilled ? "currentColor" : "none",
          };

          const iconMap: Record<string, React.ReactNode> = {
            star: <Star {...iconProps} />,
            heart: <Heart {...iconProps} />,
            circle: <Circle {...iconProps} />,
            thumb: <ThumbsUp {...iconProps} />,
            flag: <Flag {...iconProps} />,
            check: <CheckCircle {...iconProps} />,
            badge: <BadgeCheck {...iconProps} />,
            shield: <ShieldCheck {...iconProps} />,
            award: <Award {...iconProps} />,
            trophy: <Trophy {...iconProps} />,
            medal: <Medal {...iconProps} />,
            zap: <Zap {...iconProps} />,
            sparkles: <Sparkles {...iconProps} />,
            crown: <Crown {...iconProps} />,
            gem: <Gem {...iconProps} />,
            diamond: <Diamond {...iconProps} />
          };
          return iconMap[icon] || iconMap.star;
        };

        return (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Icon</div>
                <div className="relative rating-icon-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border text-[var(--color-text-tertiary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] flex items-center justify-between"
                    onClick={() => setShowRatingIconDropdown(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      {selectedRatingIconOption.icon}
                      <span>{selectedRatingIconOption.label}</span>
                    </div>
                    {showRatingIconDropdown ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>

                  {showRatingIconDropdown && (
                    <div className="absolute top-full p-2 space-y-1 left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {ratingIconOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`w-full px-3 py-2 text-left rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${ratingIcon === option.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''}`}
                          onClick={() => {
                            setRatingIcon(option.key);
                            setShowRatingIconDropdown(false);
                          }}
                        >
                          {option.icon}
                          <span>{option.label}</span>
                          {ratingIcon === option.key && (
                            <Check className="w-4 h-4 ml-auto text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Color Selection */}
              <div>
                <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Colour</div>
                <div className="relative rating-color-dropdown">
                  <button
                    type="button"
                    className="w-full px-3 py-2 border text-[var(--color-text-tertiary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-600)] flex items-center justify-between"
                    onClick={() => setShowRatingColorDropdown(v => !v)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: selectedRatingColorOption.color }}></div>
                      <span>{selectedRatingColorOption.label}</span>
                    </div>
                    {showRatingColorDropdown ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                  </button>

                  {showRatingColorDropdown && (
                    <div className="absolute top-full p-2 space-y-1 left-0 right-0 mt-1 bg-[var(--color-alpha-white)] text-[var(--color-text-secondary)] border border-[var(--color-gray-300)] rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                      {ratingColorOptions.map((color) => (
                        <button
                          key={color.key}
                          type="button"
                          className={`w-full px-3 py-2 text-left rounded-xl hover:bg-[var(--color-bg-brand-primary)] hover:text-black focus:bg-[var(--color-bg-brand-secondary)] flex items-center gap-2 ${ratingColor === color.key ? 'bg-[var(--color-bg-brand-secondary)] text-black font-bold' : ''
                            }`}
                          onClick={() => {
                            setRatingColor(color.key);
                            setShowRatingColorDropdown(false);
                          }}
                        >
                          <div className={`w-4 h-4 rounded-full`} style={{ backgroundColor: color.color }}></div>
                          <span>{color.label}</span>
                          {ratingColor === color.key && (
                            <Check className="w-4 h-4 ml-auto text-black" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Max Rating - Full Width */}
            <div className="mb-4">
              <div className="text-sm font-medium text-[var(--color-text-tertiary)] mb-2">Max rating</div>
              <Dropdown
                options={[1, 2, 3, 4, 5, 6, 7].map(n => ({ label: n.toString(), value: n.toString() }))}
                value={ratingMax.toString()}
                onChange={(value: any) => setRatingMax(value)}
                placeholder="Select max rating"
              />
            </div>

            {/* Default Value */}
            <div className="mb-3">
              <button className="flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-1" onClick={() => setShowRatingDefault(v => !v)}>
                <Plus className="w-4 h-4" />
                Set default value
              </button>

              {showRatingDefault && (
                <div //NOSONAR
                  className="flex items-center gap-2" onMouseLeave={() => setRatingDefaultHover(null)}>
                  <div className="flex gap-1">
                    {Array.from({ length: ratingMax }, (_, i) => {
                      const starIndex = i + 1;
                      // Use hover value if set, otherwise use actual default value
                      const currentValue = ratingDefaultHover ?? ratingDefault;
                      const isFilled = currentValue >= starIndex;
                      return (
                        <button
                          key={starIndex}
                          type="button"
                          onClick={() => setRatingDefault(starIndex)}
                          onMouseEnter={() => setRatingDefaultHover(starIndex)}
                          className={`my-1 h-8 w-8 flex items-center justify-center transition-all duration-150 ${isFilled ? 'scale-110' : 'hover:scale-105'
                            }`}
                          title={`Set default to ${starIndex}`}
                        >
                          <span className={isFilled ? selectedRatingFillClass : 'text-gray-300'}>
                            {getIcon(ratingIcon, isFilled)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {ratingDefault > 0 && (
                    <button
                      type="button"
                      className="ml-2 text-gray-400 hover:text-gray-600 text-sm"
                      onClick={() => setRatingDefault(0)}
                      title="Clear default"
                    >
                      Clear
                    </button>
                  )}
                  {
                    ratingDefault > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        {`Default: ${ratingDefault}/${ratingMax}`}
                      </span>
                    )
                  }
                </div>
              )}
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
      }
      case 'datetime':
      case 'createdTime':
      case 'lastModifiedTime':
        return (
          <>
            {/* Date Format */}
            <div className="mb-3">
              <div className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Date Format</div>
              <AdvancedDropdown
                options={dateFormatOptions}
                value={dateFormat}
                onChange={(val) => setDateFormat(val as string)}
              />
            </div>
            {/* Time Format */}
            <div className="mb-3">
              <div className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Time Format</div>
              <AdvancedDropdown
                options={timeFormatOptions}
                value={timeFormat}
                onChange={(value: any) => setTimeFormat(value)}
              />
            </div>

            {/* Time Display Preference */}
            <div className="mb-3">
              <div className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Time Display</div>
              <div className="flex items-center gap-2">
                {renderHourFormatToggle({
                  hourFormat,
                  setHourFormat,
                  wrapperClassName: 'flex items-center gap-2',
                })}
              </div>
            </div>

            {/* Timezone Options */}
            <div className="mb-3">
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={displayTimeZone}
                      onChange={e => setDisplayTimeZone(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-[var(--color-text-tertiary)]">Display time zone</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={sameTimezone}
                      onChange={e => setSameTimezone(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                  </div>
                  <span className="text-sm text-[var(--color-text-tertiary)]">Use same timezone for all members</span>
                </label>
                {sameTimezone && (
                  <div className="mt-2">
                    <AdvancedDropdown
                      options={timeZoneOptions.map((o: any) => ({ label: o.label, value: o.label, rightLabel: o.value, description: o.value }))}
                      value={timeZone}
                      onChange={(val: any) => setTimeZone(val as string)}
                      searchable={true}
                      placeholder="Select time zone"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Default Value - Only show for datetime, not for createdTime/lastModifiedTime */}
            {selectedType?.key === 'datetime' && (
              renderDefaultValueToggle({
                show: showDateTimeDefault,
                setShow: setShowDateTimeDefault,
                buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]',
                wrapperClassName: 'mb-3',
                children: (
                  <div className="mt-2">
                    <DateTime
                      value={dateTimeDefault}
                      onChange={(value: any) => setDateTimeDefault(value)}
                      config={{
                        dateFormat: dateFormat,
                        timeFormat: timeFormat,
                        hourFormat: hourFormat,
                      }}
                      isBorder={true}
                    />
                  </div>
                ),
              })
            )}

            {/* Description */}
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
      case 'user':
        return (
          <>
            <div className="mb-2 text-sm font-medium text-[var(--color-text-tertiary)]">Multiple users</div>
            <div className="flex items-center gap-2 mb-3">
              <label className="relative inline-flex gap-3 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultipleUsers}
                  onChange={e => setAllowMultipleUsers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-[var(--color-focus-ring)] rounded-full peer peer-checked:bg-primary transition-colors" />
                <div className="absolute left-0.5 top-1 w-4 h-4 bg-card rounded-full shadow transform transition-transform peer-checked:translate-x-4" />
                <span className="text-sm text-gray-600">When enabled, users can select multiple users</span>
              </label>
            </div>

            {renderDefaultValueToggle({
              show: showUserDefault,
              setShow: setShowUserDefault,
              children: (
                <User
                  value={selectedUsers}
                  onChange={(user: any) => setSelectedUsers(user)}
                  config={{
                    allowMultiple: allowMultipleUsers,
                    showAvatar: true,
                  }}
                  isBorder={true}
                  placeholder="Select users..."
                />
              ),
            })}
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
      case 'attachment':
        return (
          renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)]',
            wrapperClassName: 'mb-3 relative',
          })
        );
      case 'json':
        return (
          <>
            <div className="mb-3">
              {/* <label className="block text-sm font-medium text-[var(--color-text-tertiary)] mb-1">Default JSON</label> */}
              {renderDefaultValueToggle({
                show: showJsonDefault,
                setShow: setShowJsonDefault,
                children: (
                  <JSONField
                    value={defaultValue}
                    onChange={handleJsonChange}
                    placeholder='{"key": "value"}'
                    isBorder={true}
                  />
                ),
              })}
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
      case 'createdBy':
      case 'lastModifiedBy':
        return (
          renderDescriptionToggle({
            showDescription,
            setShowDescription,
            description,
            setDescription,
            buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3 space-y-2',
            wrapperClassName: 'relative',
          })
        );
      case 'formula':
        return (
          <>
            <Formula
              value={formulaText}
              config={{
                formula: formulaText,
                formatting: {
                  type: formulaFormatting.type,
                  precision: formulaFormatting.precision,
                  currency: formulaFormatting.currency,
                  dateFormat: formulaFormatting.dateFormat
                }
              }}
              columns={fields.map(field => ({
                id: field.id,
                name: field.title || field.column_name || field.key,
                title: field.title || field.column_name || field.key,
                column_name: field.column_name,
                key: field.key || field.column_name,
                type: field.type || field.uidt,
                system: field.system || field.isSystem
              }))}
              onFormulaChange={(formula) => setFormulaText(formula)}
              onErrorChange={(error) => setFormulaError(error)}
              isBorder={true}
            />
            {renderDescriptionToggle({
              showDescription,
              setShowDescription,
              description,
              setDescription,
              buttonClassName: 'flex items-center gap-2 text-primary-brand text-sm font-medium hover:text-[var(--color-brand-800)] mb-3',
              wrapperClassName: 'relative mt-3',
            })}
          </>
        );
      default:
        return null;
    }
  }


  return renderConfigStep();
}


