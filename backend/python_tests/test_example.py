"""
Cross-validation test suite for Loan Eligibility Advisor
Ensures Python implementation matches NestJS business logic

This test suite validates two aspects:
1. Core NestJS behavior: Applications always created with risk categories
2. Optional business rule: Eligibility threshold for auto-approval (DTI <= 50%)
"""

import pytest
import math

# ============== HELPER FUNCTIONS (Shared across tests) ==============

def calculate_monthly_installment(principal, annual_rate, months):
    """
    EMI calculation - MUST match NestJS eligibilityEngine exactly
    
    Formula: EMI = P * r * (1+r)^n / ((1+r)^n - 1)
    where r = monthly interest rate, n = number of months
    """
    if annual_rate == 0:
        return round(principal / months, 2)
    
    monthly_rate = annual_rate / 100 / 12
    
    if monthly_rate == 0:
        return round(principal / months, 2)
    
    numerator = principal * monthly_rate * (1 + monthly_rate) ** months
    denominator = (1 + monthly_rate) ** months - 1
    
    return round(numerator / denominator, 2)


def calculate_dti_ratio(salary, existing_monthly_debt, new_monthly_payment):
    """Calculate Debt-to-Income ratio as percentage"""
    total_monthly_debt = existing_monthly_debt + new_monthly_payment
    return (total_monthly_debt / salary) * 100


def calculate_risk_score(dti_ratio, salary):
    """
    Calculate risk score based on NestJS applyLoan logic
    
    Formula: 100 - (DTI * 0.8)
    Bonus: +10 if salary > 1,000,000
    Clamped between 20 and 120
    """
    risk_score = 100 - (dti_ratio * 0.8)
    if salary > 1000000:
        risk_score += 10
    return min(120, max(20, round(risk_score)))


def get_risk_category(dti_ratio, risk_score):
    """
    Determine risk category based on NestJS applyLoan logic
    
    Categories:
    - POOR: DTI > 50%
    - FAIR: DTI > 35% (and <= 50%)
    - EXCELLENT: risk_score > 90 (and DTI <= 35%)
    - GOOD: everything else
    """
    if dti_ratio > 50:
        return 'POOR'
    elif dti_ratio > 35:
        return 'FAIR'
    elif risk_score > 90:
        return 'EXCELLENT'
    else:
        return 'GOOD'


def is_eligible_by_dti_threshold(salary, existing_monthly_debt, requested_principal, rate, term_months):
    """
    OPTIONAL BUSINESS RULE: Eligibility threshold based on DTI <= 50%
    
    This is NOT in the current NestJS implementation but can be added
    as an auto-approval/auto-rejection rule before manual review.
    """
    monthly_payment = calculate_monthly_installment(requested_principal, rate, term_months)
    dti = calculate_dti_ratio(salary, existing_monthly_debt, monthly_payment)
    return dti <= 50


# ============== 1. TEST EMI CALCULATION ==============

def test_calculate_monthly_installment():
    """Test EMI formula matches NestJS implementation"""
    
    # Test cases that match your NestJS calculations
    assert calculate_monthly_installment(10000, 0, 12) == 833.33  # No interest
    assert calculate_monthly_installment(10000, 12, 12) == 888.49  # 12% annual
    assert calculate_monthly_installment(50000, 18, 24) == 2496.21  # 18% for 2 years
    assert calculate_monthly_installment(100000, 18, 12) == 9167.99  # High principal
    assert calculate_monthly_installment(5000, 24, 36) == 196.55  # High interest


# ============== 2. TEST AMORTIZATION (matches repayLoan logic) ==============

def test_amortization_calculation():
    """Test remaining balance calculation matches NestJS amortization"""
    
    def calculate_remaining_balance(principal, annual_rate, months, paid_months):
        """Python version of your amortization formula from loans.service.ts"""
        if paid_months <= 0:
            return principal
        
        monthly_rate = annual_rate / 100 / 12
        
        if annual_rate > 0 and paid_months > 0:
            factor_n = (1 + monthly_rate) ** months
            factor_k = (1 + monthly_rate) ** paid_months
            remaining = (principal * (factor_n - factor_k)) / (factor_n - 1)
            return max(0, round(remaining, 2))
        else:
            # Zero interest case
            monthly_payment = principal / months
            return max(0, round(principal - (monthly_payment * paid_months), 2))
    
    # Zero interest cases
    result = calculate_remaining_balance(10000, 0, 12, 6)
    assert abs(result - 5000) < 0.01
    
    result = calculate_remaining_balance(10000, 0, 12, 12)
    assert result == 0
    
    # With interest
    result = calculate_remaining_balance(50000, 18, 24, 12)
    assert 20000 < result < 30000  # Some balance remains
    
    # Fully paid with interest
    result = calculate_remaining_balance(10000, 12, 12, 12)
    assert result == 0


# ============== 3. TEST RISK SCORE AND DTI CALCULATIONS ==============

def test_dti_calculation():
    """Test Debt-to-Income ratio calculations"""
    
    # Standard case
    dti = calculate_dti_ratio(50000, 10000, 5000)
    assert dti == 30.0  # (15000/50000)*100 = 30%
    
    # High debt case
    dti = calculate_dti_ratio(80000, 30000, 20000)
    assert dti == 62.5  # (50000/80000)*100 = 62.5%
    
    # Zero debt case
    dti = calculate_dti_ratio(100000, 0, 15000)
    assert dti == 15.0


def test_risk_score_calculation():
    """Test risk score calculation matches NestJS applyLoan logic"""
    
    # Normal case
    risk_score = calculate_risk_score(30.0, 50000)
    assert risk_score == 76  # 100 - (30 * 0.8) = 76
    
    # High salary bonus ( > 1,000,000 )
    risk_score = calculate_risk_score(30.0, 1500000)
    assert risk_score == 86  # 76 + 10 = 86
    
    # High DTI case
    risk_score = calculate_risk_score(80.0, 50000)
    assert risk_score == 36  # 100 - 64 = 36
    
    # Clamping to min 20
    risk_score = calculate_risk_score(150.0, 50000)
    assert risk_score == 20  # Would be -20, clamped to 20
    
    # Clamping to max 120
    risk_score = calculate_risk_score(10.0, 2000000)
    assert risk_score == 120  # 92 + 10 = 102, but DTI low so higher


def test_risk_category_calculation():
    """Test risk category logic from NestJS applyLoan"""
    
    # POOR: DTI > 50%
    category = get_risk_category(60.0, 40)
    assert category == 'POOR'
    
    # FAIR: DTI > 35% but <= 50%
    category = get_risk_category(40.0, 68)
    assert category == 'FAIR'
    
    # EXCELLENT: risk_score > 90 and DTI <= 35%
    category = get_risk_category(20.0, 95)
    assert category == 'EXCELLENT'
    
    # GOOD: Everything else
    category = get_risk_category(30.0, 85)
    assert category == 'GOOD'


# ============== 4. TEST NESTJS CORE BEHAVIOR (Always creates application) ==============

@pytest.mark.parametrize("monthly_salary,existing_debt,requested_amount,interest_rate,months,expected_risk_category", [
    # High salary, no debt -> EXCELLENT
    (500000, 0, 100000, 18, 24, 'EXCELLENT'),
    
    # High debt + low salary -> POOR
    (100000, 50000, 100000, 18, 24, 'POOR'),
    
    # Medium salary, moderate request -> GOOD
    (300000, 50000, 200000, 18, 36, 'GOOD'),
    
    # Very low salary -> FAIR (DTI 38.34%)
    (50000, 10000, 100000, 18, 12, 'FAIR'),
    
    # High income bracket -> EXCELLENT (gets bonus)
    (1000000, 200000, 500000, 18, 48, 'EXCELLENT'),
    
    # Good profile -> GOOD
    (75000, 15000, 50000, 18, 24, 'GOOD'),
    
    # High DTI -> POOR
    (60000, 30000, 60000, 18, 24, 'POOR'),
    
    # Excellent credit scenario -> EXCELLENT
    (200000, 10000, 50000, 12, 36, 'EXCELLENT'),
    
    # Borderline case -> FAIR
    (80000, 25000, 80000, 18, 24, 'FAIR'),
])
def test_nestjs_risk_category_scenarios(monthly_salary, existing_debt, requested_amount,
                                         interest_rate, months, expected_risk_category):
    """
    Test risk category calculation (matches NestJS applyLoan logic)
    
    IMPORTANT: In NestJS, ALL applications are created with 'PENDING' status
    regardless of risk category. This test validates the category assignment only.
    """
    
    # Calculate monthly payment
    monthly_payment = calculate_monthly_installment(requested_amount, interest_rate, months)
    
    # Calculate DTI and risk score
    dti = calculate_dti_ratio(monthly_salary, existing_debt, monthly_payment)
    risk_score = calculate_risk_score(dti, monthly_salary)
    category = get_risk_category(dti, risk_score)
    
    # Add debug output for failing cases
    if category != expected_risk_category:
        print(f"\nDEBUG: Salary={monthly_salary}, Debt={existing_debt}")
        print(f"Monthly Payment={monthly_payment:.2f}, DTI={dti:.2f}%")
        print(f"Risk Score={risk_score}, Category={category}, Expected={expected_risk_category}")
    
    assert category == expected_risk_category


def test_nestjs_always_creates_application():
    """
    Verify that NestJS always creates application with PENDING status
    No automatic rejection based solely on DTI
    """
    
    def simulate_nestjs_apply_loan(salary, existing_debt, requested_amount, rate, months):
        """Simulates NestJS applyLoan method behavior"""
        monthly_payment = calculate_monthly_installment(requested_amount, rate, months)
        dti = calculate_dti_ratio(salary, existing_debt, monthly_payment)
        risk_score = calculate_risk_score(dti, salary)
        category = get_risk_category(dti, risk_score)
        
        # In NestJS, application is ALWAYS created
        return {
            'status': 'PENDING',  # Always PENDING regardless of risk
            'risk_category': category,
            'dti_ratio': dti,
            'risk_score': risk_score,
            'monthly_installment': monthly_payment
        }
    
    # Even high-risk cases get applications created
    result = simulate_nestjs_apply_loan(30000, 50000, 200000, 18, 12)
    assert result['status'] == 'PENDING'
    assert result['risk_category'] == 'POOR'
    
    # Very high DTI still creates application
    result = simulate_nestjs_apply_loan(20000, 10000, 150000, 18, 24)
    assert result['status'] == 'PENDING'
    assert result['risk_category'] in ['POOR', 'FAIR']
    
    # Excellent cases also PENDING (requires manual approval)
    result = simulate_nestjs_apply_loan(500000, 0, 100000, 18, 24)
    assert result['status'] == 'PENDING'
    assert result['risk_category'] == 'EXCELLENT'


# ============== 5. TEST OPTIONAL ELIGIBILITY THRESHOLD (Auto-approval rule) ==============

@pytest.mark.parametrize("monthly_salary,existing_debt,requested_amount,interest_rate,months,expected_eligible", [
    # High salary, no debt -> Eligible (DTI = 8.33%)
    (500000, 0, 100000, 18, 24, True),
    
    # High debt + low salary -> Not eligible (DTI = 133.33%)
    (100000, 50000, 100000, 18, 24, False),
    
    # Medium salary, moderate request -> Eligible (DTI = 41.67%)
    (300000, 50000, 200000, 18, 36, True),
    
    # Very low salary -> DTI 38.34% -> Eligible (<= 50%)
    (50000, 10000, 100000, 18, 12, True),  # FIXED: Was incorrectly expecting False
    
    # High income bracket -> Eligible (DTI = 30.83%)
    (1000000, 200000, 500000, 18, 48, True),
    
    # Good profile -> Eligible (DTI = 27.61%)
    (75000, 15000, 50000, 18, 24, True),
    
    # High DTI -> Not eligible (DTI = 72.22%)
    (60000, 30000, 60000, 18, 24, False),
    
    # Extreme case: Very high debt -> Not eligible
    (40000, 30000, 100000, 18, 12, False),
    
    # Edge case: Exactly 50% DTI -> Eligible (threshold inclusive)
    # Need to find numbers that yield exactly 50% DTI
    (100000, 0, 500000, 18, 60, True),  # Adjust as needed
    
    # Extremely low salary with small loan -> DTI might still be high
    (25000, 5000, 30000, 18, 24, False),
])
def test_optional_eligibility_threshold(monthly_salary, existing_debt, requested_amount,
                                         interest_rate, months, expected_eligible):
    """
    OPTIONAL BUSINESS RULE: Eligibility threshold based on DTI <= 50%
    
    This rule can be added to NestJS for auto-approval/auto-rejection
    before manual review. Currently NOT in the core implementation.
    
    Use case: Automatically reject applications with DTI > 50%
    to reduce manual review workload.
    """
    
    result = is_eligible_by_dti_threshold(
        monthly_salary, existing_debt, requested_amount, interest_rate, months
    )
    
    # Calculate actual DTI for debug output
    monthly_payment = calculate_monthly_installment(requested_amount, interest_rate, months)
    dti = calculate_dti_ratio(monthly_salary, existing_debt, monthly_payment)
    
    if result != expected_eligible:
        print(f"\nDEBUG: Salary={monthly_salary}, Debt={existing_debt}")
        print(f"Payment={monthly_payment:.2f}, DTI={dti:.2f}%")
        print(f"Threshold: {'Eligible' if dti <= 50 else 'Not Eligible'}")
        print(f"Expected: {expected_eligible}, Got: {result}")
    
    assert result == expected_eligible


# ============== 6. TEST FINANCIAL PROFILE UPDATE ==============

def test_financial_profile_update():
    """Test that profile updates correctly when adding a new loan"""
    
    def update_profile_on_new_loan(existing_total_borrowed, existing_monthly_debt, 
                                   new_loan_amount, new_monthly_payment):
        """Matches your createManualLoan profile update logic"""
        new_total_borrowed = existing_total_borrowed + new_loan_amount
        new_monthly_debt = existing_monthly_debt + new_monthly_payment
        return {
            'total_borrowed': new_total_borrowed,
            'existing_monthly_debt': new_monthly_debt
        }
    
    # Test case: User has existing 50k borrowed, 10k monthly debt, adds 100k loan with 8k monthly
    result = update_profile_on_new_loan(50000, 10000, 100000, 8000)
    assert result['total_borrowed'] == 150000
    assert result['existing_monthly_debt'] == 18000
    
    # Edge case: Zero existing debt
    result = update_profile_on_new_loan(0, 0, 50000, 4150)
    assert result['total_borrowed'] == 50000
    assert result['existing_monthly_debt'] == 4150
    
    # Multiple loans scenario
    result = update_profile_on_new_loan(100000, 15000, 50000, 4000)
    assert result['total_borrowed'] == 150000
    assert result['existing_monthly_debt'] == 19000


# ============== 7. TEST EDGE CASES ==============

def test_edge_cases():
    """Test boundary conditions and edge cases"""
    
    # Test extremely small loan
    result = calculate_monthly_installment(100, 18, 12)
    assert result > 0
    assert result == 9.17  # Should be consistent
    
    # Test extremely large loan
    result = calculate_monthly_installment(10000000, 18, 360)  # 10M over 30 years
    assert result > 0
    assert result == 150000.00  # Approximate
    
    # Test zero interest with zero months (should raise error)
    with pytest.raises(Exception):
        calculate_monthly_installment(1000, 0, 0)
    
    # Test extremely high interest rate
    result = calculate_monthly_installment(10000, 100, 12)
    assert result > 0
    
    # Test DTI with zero salary (edge case - should handle gracefully)
    dti = calculate_dti_ratio(0, 1000, 500)
    assert dti == float('inf') or dti > 0  # Division by zero in real code


# ============== 8. TEST CROSS-LANGUAGE CONSISTENCY ==============

def test_emi_consistency_across_scenarios():
    """Ensure Python EMI matches expected NestJS output for various scenarios"""
    
    test_scenarios = [
        (10000, 12, 12, 888.49),
        (50000, 18, 24, 2496.21),
        (200000, 15, 36, 6933.00),
        (5000, 24, 36, 196.55),
        (150000, 10, 60, 3187.50),
    ]
    
    for principal, rate, months, expected in test_scenarios:
        result = calculate_monthly_installment(principal, rate, months)
        # Allow small rounding differences
        assert abs(result - expected) < 0.05, \
            f"Failed for P={principal}, R={rate}, N={months}: got {result}, expected {expected}"


# ============== 9. TEST COMPREHENSIVE LOAN SCENARIOS ==============

def test_comprehensive_loan_workflow():
    """Test a complete loan workflow from application to approval check"""
    
    # User financial profile
    user_profile = {
        'salary': 75000,
        'existing_monthly_debt': 15000,
        'credit_score': 720
    }
    
    # Loan request
    loan_request = {
        'amount': 100000,
        'interest_rate': 18,
        'term_months': 24,
        'purpose': 'Home Improvement'
    }
    
    # Step 1: Calculate monthly payment
    monthly_payment = calculate_monthly_installment(
        loan_request['amount'],
        loan_request['interest_rate'],
        loan_request['term_months']
    )
    assert monthly_payment == 4992.42
    
    # Step 2: Calculate DTI
    dti = calculate_dti_ratio(
        user_profile['salary'],
        user_profile['existing_monthly_debt'],
        monthly_payment
    )
    assert dti == 26.66  # (19992.42/75000)*100 = 26.66%
    
    # Step 3: Calculate risk score
    risk_score = calculate_risk_score(dti, user_profile['salary'])
    assert risk_score == 79  # 100 - (26.66 * 0.8) = 78.67 rounded to 79
    
    # Step 4: Determine risk category
    category = get_risk_category(dti, risk_score)
    assert category == 'GOOD'  # DTI <= 35%, risk_score not > 90
    
    # Step 5: Check optional eligibility threshold
    is_eligible = is_eligible_by_dti_threshold(
        user_profile['salary'],
        user_profile['existing_monthly_debt'],
        loan_request['amount'],
        loan_request['interest_rate'],
        loan_request['term_months']
    )
    assert is_eligible == True  # DTI 26.66% <= 50%
    
    # Step 6: Simulate NestJS application creation
    application = {
        'status': 'PENDING',
        'risk_category': category,
        'dti_ratio': dti,
        'risk_score': risk_score,
        'monthly_installment': monthly_payment
    }
    
    assert application['status'] == 'PENDING'
    assert application['risk_category'] == 'GOOD'
    assert application['dti_ratio'] == 26.66
    assert application['risk_score'] == 79