'use client';

import { useState, useRef } from 'react';
import {
  Info,
  Upload,
  X,
  Building2,
  DollarSign,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import styles from './add-institution.module.css';

interface FormData {
  name: string;
  type?: string;
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
    general: true,
    loan: true,
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
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.headerIcon}>
            <Building2 size={32} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Add New Financial Institution</h1>
            <p className={styles.pageSubtitle}>
              Create a new institution profile with loan criteria and
              eligibility requirements
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleCancel}
            className={styles.btnSecondary}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Institution'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errors.submit && (
        <div className={styles.alertError}>
          <span>{errors.submit}</span>
        </div>
      )}

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* ──────────────────────────────────────────────────────
            SECTION 1: GENERAL INFORMATION
            ────────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <h2 className={styles.cardTitle}>General Information</h2>
              <p className={styles.cardDescription}>
                Institution name, type, status and logo
              </p>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Institution Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
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
                  Institution Type <span className={styles.required}>*</span>
                </label>
                <select
                  name="type"
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  <option value="bank">Commercial Bank</option>
                  <option value="sacco">SACCO</option>
                  <option value="microfinance">Microfinance</option>
                </select>
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <div className={styles.switchContainer}>
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className={styles.switchInput}
                  />
                  <label htmlFor="isActive" className={styles.switchLabel}>
                    <span className={styles.switchToggle}></span>
                    <span className={styles.switchText}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Institution Logo{' '}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <div className={styles.logoContainer}>
                  {formData.logoPreview ? (
                    <div className={styles.logoPreview}>
                      <img src={formData.logoPreview} alt="Institution logo" />
                      <button
                        type="button"
                        onClick={removeLogo}
                        className={styles.removeLogo}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className={styles.uploadZone}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={24} />
                      <span>Click to upload</span>
                      <span className={styles.uploadHint}>
                        PNG, JPG, GIF (max 5MB)
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
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Description <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this institution and its loan products..."
                rows={3}
                className={styles.textarea}
              />
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 2: LOAN CRITERIA
            ────────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <div className={styles.iconBadge}>
                <DollarSign size={18} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Loan Criteria</h2>
                <p className={styles.cardDescription}>
                  Interest, fees, minimum salary, and debt ratios
                </p>
              </div>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Minimum Net Salary (MWK){' '}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="minNetMonthlySalary"
                  value={formData.minNetMonthlySalary}
                  onChange={handleInputChange}
                  step="1000"
                  min="0"
                  placeholder="50000"
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
                  Debt-to-Income Cap (%){' '}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="maxDebtToIncomeRatio"
                  value={formData.maxDebtToIncomeRatio}
                  onChange={handleInputChange}
                  step="1"
                  min="0"
                  max="100"
                  placeholder="30"
                  className={`${styles.input} ${errors.maxDebtToIncomeRatio ? styles.inputError : ''}`}
                />
                {errors.maxDebtToIncomeRatio && (
                  <span className={styles.errorText}>
                    {errors.maxDebtToIncomeRatio}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Interest Rate (% p.a.){' '}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  placeholder="15"
                  className={`${styles.input} ${errors.interestRate ? styles.inputError : ''}`}
                />
                {errors.interestRate && (
                  <span className={styles.errorText}>
                    {errors.interestRate}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Processing Fee (%){' '}
                  <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  type="number"
                  name="processingFee"
                  value={formData.processingFee}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  placeholder="2"
                  className={`${styles.input} ${errors.processingFee ? styles.inputError : ''}`}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Eligible Employment Types{' '}
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.checkboxGrid}>
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
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 3: SALARY MULTIPLIERS (PROMINENT)
            ────────────────────────────────────────────────────── */}
        <div className={styles.cardHighlight}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <div className={styles.iconBadgeHighlight}>
                <Users size={18} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Salary Multipliers</h2>
                <p className={styles.cardDescription}>
                  Maximum loan amount = Salary × Multiplier (e.g., 50,000 MK × 4
                  = 200,000 MK max loan)
                </p>
              </div>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.multiplierTableContainer}>
              <table className={styles.multiplierTable}>
                <thead>
                  <tr>
                    <th>Employment Type</th>
                    <th>Multiplier</th>
                  </tr>
                </thead>
                <tbody>
                  {MULTIPLIER_FIELDS.map((field) => (
                    <tr key={field.key}>
                      <td className={styles.multiplierLabel}>{field.label}</td>
                      <td className={styles.multiplierValue}>
                        <div className={styles.multiplierInputGroup}>
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
                            className={styles.multiplierInput}
                          />
                          <span className={styles.multiplierUnit}>x</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 4: REPAYMENT TERMS
            ────────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <div className={styles.iconBadge}>
                <Clock size={18} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Repayment Terms</h2>
                <p className={styles.cardDescription}>
                  Minimum and maximum loan duration
                </p>
              </div>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.gridTwo}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Minimum Repayment (months){' '}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="minRepaymentTerm"
                  value={formData.minRepaymentTerm}
                  onChange={handleInputChange}
                  step="1"
                  min="1"
                  placeholder="6"
                  className={`${styles.input} ${errors.minRepaymentTerm ? styles.inputError : ''}`}
                />
                {errors.minRepaymentTerm && (
                  <span className={styles.errorText}>
                    {errors.minRepaymentTerm}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Maximum Repayment (months){' '}
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  name="maxRepaymentTerm"
                  value={formData.maxRepaymentTerm}
                  onChange={handleInputChange}
                  step="1"
                  min="1"
                  placeholder="60"
                  className={`${styles.input} ${errors.maxRepaymentTerm ? styles.inputError : ''}`}
                />
                {errors.maxRepaymentTerm && (
                  <span className={styles.errorText}>
                    {errors.maxRepaymentTerm}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────
            SECTION 5: REQUIREMENTS & CONDITIONS
            ────────────────────────────────────────────────────── */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardHeaderContent}>
              <div className={styles.iconBadge}>
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Features & Requirements</h2>
                <p className={styles.cardDescription}>
                  Special conditions for eligibility
                </p>
              </div>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.checkboxGrid}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="requiresGuarantor"
                  checked={formData.requiresGuarantor}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                <span>Requires Guarantor</span>
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
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Additional Notes{' '}
                <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleInputChange}
                placeholder="Any special conditions, notes, or requirements shown to users..."
                rows={4}
                className={styles.textarea}
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={styles.footerActions}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.btnSecondary}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Institution'}
          </button>
        </div>
      </form>
    </div>
  );
}
// Helper: Tooltip Component
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className={styles.tooltipContainer}>
      <button
        type="button"
        className={styles.tooltipTrigger}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={(e) => {
          e.preventDefault();
          setShow(!show);
        }}
      >
        <Info size={14} />
      </button>
      {show && <div className={styles.tooltip}>{text}</div>}
    </div>
  );
}
