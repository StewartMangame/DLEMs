'use client';

import { useState, useRef } from 'react';
import { ChevronUp, ChevronDown, Info, Upload, X } from 'lucide-react';
import styles from './add-institution.module.css';

interface FormData {
  name: string;
  description: string;
  isActive: boolean;
  logo: File | null;
  logoPreview: string;

  // Loan Parameters
  interestRate: number;
  processingFee: number;
  insuranceFee: number;
  maxDebtToIncomeRatio: number;

  // Salary & Income
  minNetMonthlySalary: number;
  eligibleEmploymentTypes: string[];

  // Salary Multipliers
  multipliers: {
    civilServant: number;
    privateSector: number;
    selfEmployed: number;
    saccoMember: number;
  };

  // Repayment Terms
  minRepaymentTerm: number;
  maxRepaymentTerm: number;

  // Additional Conditions
  requiresGuarantor: boolean;
  requiresPayslip: boolean;
  requiresCollateral: boolean;
  additionalNotes: string;
}

interface FormErrors {
  [key: string]: string;
}

const EMPLOYMENT_TYPES = [
  { value: 'civil_servant', label: 'Civil Servant' },
  { value: 'private_sector', label: 'Private Sector' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'sacco_member', label: 'SACCO Member' },
];

const MULTIPLIER_FIELDS = [
  { key: 'civilServant', label: 'Civil Servant' },
  { key: 'privateSector', label: 'Private Sector' },
  { key: 'selfEmployed', label: 'Self-Employed' },
  { key: 'saccoMember', label: 'SACCO Member' },
];

export default function AddInstitution() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    isActive: true,
    logo: null,
    logoPreview: '',

    interestRate: 15,
    processingFee: 2,
    insuranceFee: 0,
    maxDebtToIncomeRatio: 30,

    minNetMonthlySalary: 50000,
    eligibleEmploymentTypes: ['civil_servant', 'private_sector'],

    multipliers: {
      civilServant: 4,
      privateSector: 3,
      selfEmployed: 2,
      saccoMember: 3,
    },

    minRepaymentTerm: 6,
    maxRepaymentTerm: 60,

    requiresGuarantor: false,
    requiresPayslip: true,
    requiresCollateral: false,
    additionalNotes: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    parameters: true,
    salary: true,
    multipliers: true,
    repayment: true,
    conditions: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
            ? parseFloat(value) || 0
            : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleEmploymentTypeChange = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      eligibleEmploymentTypes: prev.eligibleEmploymentTypes.includes(type)
        ? prev.eligibleEmploymentTypes.filter((t) => t !== type)
        : [...prev.eligibleEmploymentTypes, type],
    }));
  };

  const handleMultiplierChange = (
    field: keyof FormData['multipliers'],
    value: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      multipliers: {
        ...prev.multipliers,
        [field]: value,
      },
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({
          ...prev,
          logo: 'Please upload a valid image file',
        }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, logo: 'Image must be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          logo: file,
          logoPreview: reader.result as string,
        }));
        setErrors((prev) => ({ ...prev, logo: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: null,
      logoPreview: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Institution name is required';
    if (formData.interestRate < 0)
      newErrors.interestRate = 'Interest rate cannot be negative';
    if (formData.processingFee < 0)
      newErrors.processingFee = 'Processing fee cannot be negative';
    if (formData.insuranceFee < 0)
      newErrors.insuranceFee = 'Insurance fee cannot be negative';
    if (
      formData.maxDebtToIncomeRatio <= 0 ||
      formData.maxDebtToIncomeRatio > 100
    )
      newErrors.maxDebtToIncomeRatio = 'DTI ratio must be between 0 and 100';
    if (formData.minNetMonthlySalary < 0)
      newErrors.minNetMonthlySalary = 'Minimum salary cannot be negative';
    if (formData.eligibleEmploymentTypes.length === 0)
      newErrors.eligibleEmploymentTypes = 'Select at least one employment type';
    if (formData.minRepaymentTerm <= 0)
      newErrors.minRepaymentTerm = 'Minimum term must be greater than 0';
    if (formData.maxRepaymentTerm <= formData.minRepaymentTerm)
      newErrors.maxRepaymentTerm =
        'Maximum term must be greater than minimum term';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formPayload = new FormData();

      // Basic info
      formPayload.append('name', formData.name);
      formPayload.append('description', formData.description);
      formPayload.append('isActive', String(formData.isActive));
      if (formData.logo) {
        formPayload.append('logo', formData.logo);
      }

      // Loan parameters
      formPayload.append('interestRate', String(formData.interestRate));
      formPayload.append('processingFee', String(formData.processingFee));
      formPayload.append('insuranceFee', String(formData.insuranceFee));
      formPayload.append(
        'maxDebtToIncomeRatio',
        String(formData.maxDebtToIncomeRatio),
      );

      // Salary & income
      formPayload.append(
        'minNetMonthlySalary',
        String(formData.minNetMonthlySalary),
      );
      formPayload.append(
        'eligibleEmploymentTypes',
        JSON.stringify(formData.eligibleEmploymentTypes),
      );

      // Multipliers
      formPayload.append('multipliers', JSON.stringify(formData.multipliers));

      // Repayment terms
      formPayload.append('minRepaymentTerm', String(formData.minRepaymentTerm));
      formPayload.append('maxRepaymentTerm', String(formData.maxRepaymentTerm));

      // Conditions
      formPayload.append(
        'requiresGuarantor',
        String(formData.requiresGuarantor),
      );
      formPayload.append('requiresPayslip', String(formData.requiresPayslip));
      formPayload.append(
        'requiresCollateral',
        String(formData.requiresCollateral),
      );
      formPayload.append('additionalNotes', formData.additionalNotes);

      const response = await fetch('/api/admin-panel/institutions', {
        method: 'POST',
        body: formPayload,
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        setErrors({ submit: data.message || 'Failed to create institution' });
        return;
      }

      // Success - redirect or reset
      alert('Institution added successfully!');
      window.location.href = '/admin-panel/institutions';
    } catch (err: any) {
      setErrors({ submit: err.message || 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard all changes?')) {
      window.history.back();
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Add New Institution</h1>
          <p className={styles.subtitle}>
            Create a new financial institution profile with eligibility criteria
          </p>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleCancel}
            className={styles.btnCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={styles.btnSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Institution'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errors.submit && (
        <div className={styles.errorAlert}>
          <span>{errors.submit}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* SECTION 1: Basic Information */}
        <Section
          title="Basic Information"
          description="Institution name, logo, and status"
          expanded={expandedSections.basic}
          onToggle={() => toggleSection('basic')}
        >
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Institution Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., FDH Bank"
                className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
              />
              {errors.name && (
                <span className={styles.errorText}>{errors.name}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Status
                <Tooltip text="Toggle to activate or deactivate this institution" />
              </label>
              <div className={styles.toggleContainer}>
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className={styles.toggleCheckbox}
                />
                <label htmlFor="isActive" className={styles.toggleLabel}>
                  <span className={styles.toggleKnob}></span>
                  <span className={styles.toggleText}>
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Short Description{' '}
              <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe this institution and its loan offerings..."
              rows={3}
              className={styles.textarea}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Institution Logo{' '}
              <span className={styles.optional}>(optional)</span>
            </label>
            <div className={styles.logoUploadContainer}>
              {formData.logoPreview ? (
                <div className={styles.logoPreview}>
                  <img src={formData.logoPreview} alt="Institution logo" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className={styles.removeLogo}
                    title="Remove logo"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  className={styles.uploadBox}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} />
                  <span>Click to upload or drag and drop</span>
                  <span className={styles.uploadSubtext}>
                    PNG, JPG or GIF (max. 5MB)
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className={styles.fileInput}
              />
              {errors.logo && (
                <span className={styles.errorText}>{errors.logo}</span>
              )}
            </div>
          </div>
        </Section>

        {/* SECTION 2: Loan Parameters */}
        <Section
          title="Loan Parameters"
          description="Set interest rate, fees, and debt-to-income limits"
          expanded={expandedSections.parameters}
          onToggle={() => toggleSection('parameters')}
        >
          <div className={styles.grid4}>
            <div className={styles.formGroup}>
              <label htmlFor="interestRate" className={styles.label}>
                Interest Rate (%)
                <Tooltip text="Annual interest rate charged on loans" />
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="interestRate"
                name="interestRate"
                value={formData.interestRate}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={`${styles.input} ${errors.interestRate ? styles.inputError : ''}`}
              />
              {errors.interestRate && (
                <span className={styles.errorText}>{errors.interestRate}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="processingFee" className={styles.label}>
                Processing Fee (%)
                <Tooltip text="One-time fee charged when loan is approved" />
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="processingFee"
                name="processingFee"
                value={formData.processingFee}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={`${styles.input} ${errors.processingFee ? styles.inputError : ''}`}
              />
              {errors.processingFee && (
                <span className={styles.errorText}>{errors.processingFee}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="insuranceFee" className={styles.label}>
                Insurance Fee (%)
                <Tooltip text="Optional loan protection insurance fee" />
              </label>
              <input
                type="number"
                id="insuranceFee"
                name="insuranceFee"
                value={formData.insuranceFee}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="maxDebtToIncomeRatio" className={styles.label}>
                Max DTI Ratio (%)
                <Tooltip text="Maximum debt-to-income ratio. 30% means monthly debt payments cannot exceed 30% of monthly income" />
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="maxDebtToIncomeRatio"
                name="maxDebtToIncomeRatio"
                value={formData.maxDebtToIncomeRatio}
                onChange={handleInputChange}
                step="1"
                min="0"
                max="100"
                className={`${styles.input} ${errors.maxDebtToIncomeRatio ? styles.inputError : ''}`}
              />
              {errors.maxDebtToIncomeRatio && (
                <span className={styles.errorText}>
                  {errors.maxDebtToIncomeRatio}
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* SECTION 3: Salary & Income Requirements */}
        <Section
          title="Salary & Income Requirements"
          description="Set minimum salary and eligible employment types"
          expanded={expandedSections.salary}
          onToggle={() => toggleSection('salary')}
        >
          <div className={styles.formGroup}>
            <label htmlFor="minNetMonthlySalary" className={styles.label}>
              Minimum Net Monthly Salary (MK)
              <Tooltip text="Minimum monthly take-home salary required to qualify" />
              <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              id="minNetMonthlySalary"
              name="minNetMonthlySalary"
              value={formData.minNetMonthlySalary}
              onChange={handleInputChange}
              step="1000"
              min="0"
              className={`${styles.input} ${errors.minNetMonthlySalary ? styles.inputError : ''}`}
            />
            {errors.minNetMonthlySalary && (
              <span className={styles.errorText}>
                {errors.minNetMonthlySalary}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Eligible Employment Types{' '}
              <span className={styles.required}>*</span>
              <Tooltip text="Select which employment types can qualify for loans at this institution" />
            </label>
            <div className={styles.checkboxGroup}>
              {EMPLOYMENT_TYPES.map((type) => (
                <label key={type.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.eligibleEmploymentTypes.includes(
                      type.value,
                    )}
                    onChange={() => handleEmploymentTypeChange(type.value)}
                    className={styles.checkbox}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
            {errors.eligibleEmploymentTypes && (
              <span className={styles.errorText}>
                {errors.eligibleEmploymentTypes}
              </span>
            )}
          </div>
        </Section>

        {/* SECTION 4: Salary Multipliers */}
        <Section
          title="Salary Multipliers"
          description="Define how much applicants can borrow based on their salary"
          expanded={expandedSections.multipliers}
          onToggle={() => toggleSection('multipliers')}
          info="Multipliers determine maximum loan amount. E.g., 4x multiplier on 50,000 MK salary = 200,000 MK max loan"
        >
          <div className={styles.multiplierTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCol1}>Employment Type</div>
              <div className={styles.tableCol2}>Multiplier</div>
            </div>
            {MULTIPLIER_FIELDS.map((field) => (
              <div key={field.key} className={styles.tableRow}>
                <div className={styles.tableCol1}>{field.label}</div>
                <div className={styles.tableCol2}>
                  <div className={styles.multiplierInput}>
                    <input
                      type="number"
                      value={
                        formData.multipliers[
                          field.key as keyof typeof formData.multipliers
                        ]
                      }
                      onChange={(e) =>
                        handleMultiplierChange(
                          field.key as keyof typeof formData.multipliers,
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      step="0.5"
                      min="0"
                      className={styles.input}
                    />
                    <span className={styles.multiplierUnit}>x</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* SECTION 5: Repayment Terms */}
        <Section
          title="Repayment Terms"
          description="Set minimum and maximum loan repayment periods"
          expanded={expandedSections.repayment}
          onToggle={() => toggleSection('repayment')}
        >
          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label htmlFor="minRepaymentTerm" className={styles.label}>
                Minimum Repayment Term (Months)
                <Tooltip text="Shortest loan period allowed (e.g., 6 months)" />
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="minRepaymentTerm"
                name="minRepaymentTerm"
                value={formData.minRepaymentTerm}
                onChange={handleInputChange}
                step="1"
                min="1"
                className={`${styles.input} ${errors.minRepaymentTerm ? styles.inputError : ''}`}
              />
              {errors.minRepaymentTerm && (
                <span className={styles.errorText}>
                  {errors.minRepaymentTerm}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="maxRepaymentTerm" className={styles.label}>
                Maximum Repayment Term (Months)
                <Tooltip text="Longest loan period allowed (e.g., 60 months)" />
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="maxRepaymentTerm"
                name="maxRepaymentTerm"
                value={formData.maxRepaymentTerm}
                onChange={handleInputChange}
                step="1"
                min="1"
                className={`${styles.input} ${errors.maxRepaymentTerm ? styles.inputError : ''}`}
              />
              {errors.maxRepaymentTerm && (
                <span className={styles.errorText}>
                  {errors.maxRepaymentTerm}
                </span>
              )}
            </div>
          </div>
        </Section>

        {/* SECTION 6: Additional Conditions */}
        <Section
          title="Additional Conditions"
          description="Set special requirements for loan eligibility"
          expanded={expandedSections.conditions}
          onToggle={() => toggleSection('conditions')}
        >
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="requiresGuarantor"
                checked={formData.requiresGuarantor}
                onChange={handleInputChange}
                className={styles.checkbox}
              />
              <span>Requires Guarantor</span>
              <Tooltip text="Applicant must provide a personal or business guarantor" />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="requiresPayslip"
                checked={formData.requiresPayslip}
                onChange={handleInputChange}
                className={styles.checkbox}
              />
              <span>Requires Payslip</span>
              <Tooltip text="Applicant must provide recent payslips for income verification" />
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="requiresCollateral"
                checked={formData.requiresCollateral}
                onChange={handleInputChange}
                className={styles.checkbox}
              />
              <span>Requires Collateral</span>
              <Tooltip text="Applicant must pledge collateral (property, vehicle, etc.)" />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="additionalNotes" className={styles.label}>
              Additional Notes / Special Conditions{' '}
              <span className={styles.optional}>(optional)</span>
            </label>
            <textarea
              id="additionalNotes"
              name="additionalNotes"
              value={formData.additionalNotes}
              onChange={handleInputChange}
              placeholder="Any additional eligibility criteria, special terms, or notes for admins..."
              rows={4}
              className={styles.textarea}
            />
          </div>
        </Section>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.btnCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Institution'}
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper Components

function Section({
  title,
  description,
  expanded,
  onToggle,
  info,
  children,
}: {
  title: string;
  description: string;
  expanded: boolean;
  onToggle: () => void;
  info?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <button type="button" onClick={onToggle} className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <h2 className={styles.sectionHeading}>{title}</h2>
          <p className={styles.sectionDesc}>{description}</p>
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {info && (
        <div className={styles.infoBox}>
          <Info size={16} />
          <span>{info}</span>
        </div>
      )}

      {expanded && <div className={styles.sectionContent}>{children}</div>}
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={styles.tooltipContainer}>
      <button
        type="button"
        className={styles.tooltipTrigger}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          e.preventDefault();
          setShowTooltip(!showTooltip);
        }}
      >
        <Info size={14} />
      </button>
      {showTooltip && <div className={styles.tooltipContent}>{text}</div>}
    </div>
  );
}
