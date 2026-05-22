# Add Institution Form - Admin Dashboard

## Overview

The **Add New Institution** form is a professional, modern form component for adding financial institutions (Banks or SACCOs) to the DLEM (Digital Loan Eligibility and Management) system. It enables non-technical admins to dynamically add new institutions without any code changes.

## Features

### ✨ User-Friendly Design

- **Clean, Modern UI** with professional styling and purple accent colors
- **Collapsible Sections** for better organization and reduced cognitive load
- **Responsive Design** that works on desktop, tablet, and mobile devices
- **Helpful Tooltips** on complex fields to guide users
- **Real-time Validation** with clear error messages

### 📋 Form Sections

#### 1. **Basic Information**

- **Institution Name** (required) - Bank or SACCO name
- **Logo Upload** (optional) - Institution logo with preview
  - Supports PNG, JPG, GIF (max 5MB)
  - Drag-and-drop upload
  - Image preview with remove option
- **Short Description** (optional) - Brief overview of the institution
- **Status Toggle** - Activate/deactivate the institution

#### 2. **Loan Parameters**

Configure core loan settings:

- **Interest Rate (%)** - Annual interest rate charged on loans
- **Processing Fee (%)** - One-time fee when loan is approved
- **Insurance Fee (%)** - Optional loan protection insurance
- **Max Debt-to-Income Ratio (%)** - Maximum monthly debt payments as % of income

#### 3. **Salary & Income Requirements**

Define eligibility criteria:

- **Minimum Net Monthly Salary** - Minimum monthly take-home salary
- **Eligible Employment Types** (multi-select)
  - Civil Servant
  - Private Sector
  - Self-Employed
  - SACCO Member

#### 4. **Salary Multipliers** ⭐ Important

Set how much applicants can borrow based on salary:

- Displayed as a clean, organized table
- Each employment type has its own multiplier
- Example: 4x multiplier on 50,000 MK salary = 200,000 MK max loan
- Multipliers can be fractional (e.g., 2.5x)

#### 5. **Repayment Terms**

Configure loan period options:

- **Minimum Repayment Term** (months) - Shortest allowed loan period
- **Maximum Repayment Term** (months) - Longest allowed loan period

#### 6. **Additional Conditions**

Set special requirements:

- **Requires Guarantor** - Whether applicant must provide a guarantor
- **Requires Payslip** - Whether recent payslips are needed
- **Requires Collateral** - Whether collateral must be pledged
- **Additional Notes** - Special terms or conditions for admins

## How to Use the Form

### Accessing the Form

```
Admin Dashboard → Institutions → Add New Institution
URL: /admin-panel/institutions/new
```

### Step-by-Step Guide

1. **Enter Basic Information**
   - Type the institution name (e.g., "FDH Bank")
   - Upload a logo (optional but recommended)
   - Add a short description
   - Ensure "Active" toggle is ON to make it available

2. **Configure Loan Parameters**
   - Enter interest rate (typical: 12-20%)
   - Enter processing fee (typical: 1-3%)
   - Enter insurance fee if applicable
   - Set debt-to-income ratio (typical: 30-40%)

3. **Set Income Requirements**
   - Enter minimum monthly salary
   - Select which employment types can apply

4. **Define Salary Multipliers** (Important!)
   - Civil Servant: How many times monthly salary can be borrowed (typical: 3-5x)
   - Private Sector: Often lower multiplier (typical: 2-3x)
   - Self-Employed: Usually lowest (typical: 1.5-2.5x)
   - SACCO Member: Variable (typical: 2-4x)

5. **Set Repayment Terms**
   - Minimum term (e.g., 6 months)
   - Maximum term (e.g., 60 months for 5 years)

6. **Add Special Conditions**
   - Check boxes for guarantor, payslip, and collateral requirements
   - Add any notes for credit officers

7. **Save**
   - Click "Save Institution" button
   - Form will validate all required fields
   - Success confirmation will redirect to institutions list

### Form Validation

The form validates:

- ✅ All required fields are filled
- ✅ Numeric values are valid and positive
- ✅ DTI ratio is between 0-100%
- ✅ At least one employment type is selected
- ✅ Maximum term > Minimum term
- ✅ Logo file is valid image (if uploaded)
- ✅ Image file size < 5MB

### Tooltips and Help

Hover over the info icon (ℹ️) next to any field to see detailed help text explaining:

- What the field means
- Why it's important
- What values are typical

## Technical Details

### Component Structure

```
add-institution.tsx
├── State Management (Form Data, Errors, UI State)
├── Event Handlers
│   ├── Input changes
│   ├── Employment type selection
│   ├── Salary multiplier updates
│   ├── Logo upload/removal
│   └── Form submission
├── Validation Logic
└── UI Components
    ├── Section (collapsible form sections)
    ├── Tooltip (help text on hover)
    └── Form Fields (inputs, textareas, checkboxes, etc.)
```

### Styling

- **CSS Module**: `add-institution.module.css`
- **Design System**: Uses project's CSS variables for theming
- **Colors**:
  - Primary: Purple gradient (#7c3aed → #a855f7)
  - Success: #22c55e
  - Danger: #ef4444
  - Warning: #f59e0b
- **Responsive**: Mobile-first design with breakpoints at 768px and 480px

### API Integration

The form submits data to:

```
POST /api/admin-panel/institutions
```

**Request Body** (FormData):

```javascript
{
  name: string,
  description: string,
  isActive: boolean,
  logo: File (optional),
  interestRate: number,
  processingFee: number,
  insuranceFee: number,
  maxDebtToIncomeRatio: number,
  minNetMonthlySalary: number,
  eligibleEmploymentTypes: string[],
  multipliers: {
    civilServant: number,
    privateSector: number,
    selfEmployed: number,
    saccoMember: number
  },
  minRepaymentTerm: number,
  maxRepaymentTerm: number,
  requiresGuarantor: boolean,
  requiresPayslip: boolean,
  requiresCollateral: boolean,
  additionalNotes: string
}
```

## Examples

### Example 1: FDH Bank

```
Name: FDH Bank
Interest Rate: 16%
Processing Fee: 2%
Min Salary: 50,000 MK
Employment Types: Civil Servant, Private Sector
Multipliers:
  - Civil Servant: 4x
  - Private Sector: 3x
  - Self-Employed: 2x
  - SACCO Member: 3x
Repayment: 6-60 months
Requires: Payslip
```

### Example 2: SACCO

```
Name: Malawi Police SACCO
Interest Rate: 12%
Processing Fee: 1%
Min Salary: 30,000 MK
Employment Types: SACCO Member
Multipliers:
  - Civil Servant: 3x
  - Private Sector: 2.5x
  - Self-Employed: 2x
  - SACCO Member: 4x
Repayment: 12-60 months
Requires: Guarantor, Payslip
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- ♿ Semantic HTML structure
- ♿ Proper label associations
- ♿ Keyboard navigation support
- ♿ Color contrast compliant
- ♿ Error messages clearly associated with fields

## Future Enhancements

- [ ] Multi-language support
- [ ] Bulk import from CSV
- [ ] Institution template presets
- [ ] Advanced validation rules
- [ ] Form save as draft feature
- [ ] Audit trail for changes
- [ ] Clone existing institution

## Troubleshooting

### Form Won't Submit

1. Check browser console for errors
2. Verify all required fields are filled
3. Check that numeric values are valid
4. Ensure at least one employment type is selected

### Logo Upload Failed

1. Verify file is an image (PNG, JPG, GIF)
2. Check file size is under 5MB
3. Try a different image format

### Validation Errors

- **"Institution name is required"** → Enter an institution name
- **"DTI ratio must be between 0 and 100"** → Enter value between 0-100
- **"Maximum term must be greater than minimum term"** → Increase max term
- **"Select at least one employment type"** → Check at least one checkbox

## Contact & Support

For issues or feature requests, contact the development team.
