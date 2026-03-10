// ============================================================
// FinanceMe — Financial Health Score Calculator
// ============================================================

/**
 * Factor weights for the health score (0-100):
 * - Savings Rate (savings / income): 30% weight, ideal ≥ 20%
 * - Budget Adherence (% categories on track): 25% weight, ideal 100%
 * - Expense Ratio (expense / income): 25% weight, ideal ≤ 70%
 * - Investment Allocation: 20% weight, ideal ≥ 10% of income
 */

interface HealthScoreInput {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  budgetAdherence: number;   // 0-100 percentage of categories within budget
  investmentRate: number;     // percentage of income allocated to investments
}

interface HealthScoreResult {
  score: number;
  label: string;
  color: string;
  breakdown: {
    savingsRate: { score: number; value: number };
    budgetAdherence: { score: number; value: number };
    expenseRatio: { score: number; value: number };
    investmentAllocation: { score: number; value: number };
  };
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  const { totalIncome, totalExpense, totalSavings, budgetAdherence, investmentRate } = input;

  // ── Savings Rate (30% weight) ──
  // Ideal: ≥ 20% of income saved
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  const savingsScore = Math.min(100, (savingsRate / 20) * 100);

  // ── Budget Adherence (25% weight) ──
  // Ideal: 100% of categories within budget
  const budgetScore = Math.min(100, budgetAdherence);

  // ── Expense Ratio (25% weight) ──
  // Ideal: ≤ 70% of income spent
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 100;
  const expenseScore = expenseRatio <= 70
    ? 100
    : Math.max(0, 100 - ((expenseRatio - 70) / 30) * 100);

  // ── Investment Allocation (20% weight) ──
  // Ideal: ≥ 10% of income
  const investmentScore = Math.min(100, (investmentRate / 10) * 100);

  // ── Weighted total ──
  const totalScore = Math.round(
    savingsScore * 0.30 +
    budgetScore * 0.25 +
    expenseScore * 0.25 +
    investmentScore * 0.20
  );

  const clampedScore = Math.max(0, Math.min(100, totalScore));

  return {
    score: clampedScore,
    label: getScoreLabel(clampedScore),
    color: getScoreColor(clampedScore),
    breakdown: {
      savingsRate: { score: Math.round(savingsScore), value: Math.round(savingsRate * 100) / 100 },
      budgetAdherence: { score: Math.round(budgetScore), value: budgetAdherence },
      expenseRatio: { score: Math.round(expenseScore), value: Math.round(expenseRatio * 100) / 100 },
      investmentAllocation: { score: Math.round(investmentScore), value: investmentRate },
    },
  };
}

function getScoreLabel(score: number): string {
  if (score <= 40) return 'Kritis';
  if (score <= 60) return 'Waspada';
  if (score <= 80) return 'Baik';
  return 'Excellent';
}

function getScoreColor(score: number): string {
  if (score <= 40) return '#EF4444'; // Red
  if (score <= 60) return '#F59E0B'; // Amber
  if (score <= 80) return '#22C55E'; // Green
  return '#3B82F6'; // Blue
}
