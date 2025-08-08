import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

const RealEstateCalculators = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("mortgage");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const getSliderTransform = () => {
    switch (activeTab) {
      case "mortgage":
        return "translateX(0%)";
      case "seller":
        return "translateX(100%)";
      case "rental":
        return "translateX(200%)";
      default:
        return "translateX(0%)";
    }
  };

  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">{t('calculators.title')}</h2>

        <Tabs defaultValue="mortgage" className="w-full" onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-50 p-1 rounded-lg relative border border-gray-200">
                        <TabsTrigger
              value="mortgage"
              className="relative z-30 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=active]:bg-transparent transition-all duration-300 ease-in-out"
            >
              {t('calculators.mortgage')}
            </TabsTrigger>
            <TabsTrigger
              value="seller"
              className="relative z-30 data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=inactive]:text-gray-700 transition-all duration-300 ease-in-out"
            >
              {t('calculators.seller_proceeds')}
            </TabsTrigger>
            <TabsTrigger
              value="rental"
              className="relative z-30 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=active]:bg-transparent transition-all duration-300 ease-in-out"
            >
              {t('calculators.rental_income')}
            </TabsTrigger>
                                    <div className="absolute inset-1 bg-gray-800 rounded-md transition-transform duration-300 ease-in-out"
                 style={{
                   transform: getSliderTransform(),
                   width: 'calc(33.333% - 0.125rem)',
                 }}
            />
          </TabsList>

          <div className="mt-8 relative overflow-hidden">
            <div className="transition-transform duration-300 ease-in-out">
              <TabsContent value="mortgage" className="animate-in slide-in-from-right-4 duration-300">
                <MortgageCalculator />
              </TabsContent>

              <TabsContent value="seller" className="animate-in slide-in-from-right-4 duration-300">
                <SellerProceedsCalculator />
              </TabsContent>

              <TabsContent value="rental" className="animate-in slide-in-from-right-4 duration-300">
                <RentalIncomeCalculator />
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const MortgageCalculator = () => {
  const { t } = useTranslation();
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(5.5);
  const [propertyTax, setPropertyTax] = useState(5000);
  const [insurance, setInsurance] = useState(1200);
    const [hoa, setHoa] = useState(0);

  // Track input focus to prevent reformatting while typing
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Track raw input values for decimal inputs
  const [rawInputValues, setRawInputValues] = useState<{[key: string]: string}>({
    downPaymentPercent: downPaymentPercent.toString(),
    interestRate: interestRate.toString()
  });

  // Handlers for property tax, insurance, and HOA
  const handlePropertyTaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setPropertyTax(value);
    }
  };

  const handleInsuranceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setInsurance(value);
    }
  };

  const handleHoaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setHoa(value);
    }
  };

  // Calculate monthly payment
  const calculateMonthlyPayment = () => {
    const principal = homePrice - downPayment;
    const monthlyInterest = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPrincipalAndInterest =
      principal *
      (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) /
      (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);

    const monthlyPropertyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyHOA = hoa;

    const totalMonthlyPayment = monthlyPrincipalAndInterest + monthlyPropertyTax + monthlyInsurance + monthlyHOA;

    return {
      principalAndInterest: monthlyPrincipalAndInterest,
      propertyTax: monthlyPropertyTax,
      insurance: monthlyInsurance,
      hoa: monthlyHOA,
      total: totalMonthlyPayment
    };
  };

  const handleHomePriceChange = (value: number) => {
    setHomePrice(value);
    // Update down payment amount while maintaining percentage
    setDownPayment((value * downPaymentPercent) / 100);
  };

  const handleHomePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setHomePrice(value);
      // Update down payment amount while maintaining percentage
      setDownPayment((value * downPaymentPercent) / 100);
    }
  };

  const handleDownPaymentChange = (value: number) => {
    setDownPayment(value);
    // Update down payment percentage
    if (homePrice > 0) {
      setDownPaymentPercent((value / homePrice) * 100);
    }
  };

  const handleDownPaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setDownPayment(value);
      // Update down payment percentage
      if (homePrice > 0) {
        setDownPaymentPercent((value / homePrice) * 100);
      }
    }
  };

  const handleDownPaymentPercentChange = (value: number) => {
    setDownPaymentPercent(value);
    // Update raw input value
    setRawInputValues(prev => ({ ...prev, downPaymentPercent: value.toString() }));
    // Update down payment amount
    setDownPayment((homePrice * value) / 100);
  };

    const handleDownPaymentPercentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    // Allow empty string or valid decimal numbers
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      // Store the raw input value
      setRawInputValues(prev => ({ ...prev, downPaymentPercent: rawValue }));

      if (rawValue === '') {
        setDownPaymentPercent(0);
        setDownPayment(0);
      } else {
        const value = Number(rawValue);
        if (!isNaN(value) && value >= 0 && value <= 100) {
          setDownPaymentPercent(value);
          // Update down payment amount
          setDownPayment((homePrice * value) / 100);
        }
        // Always update the raw input value even if validation fails
        // This allows typing partial decimals like "20.6" while typing "20.67"
      }
    }
  };

  const handleInterestRateChange = (value: number) => {
    setInterestRate(value);
  };

    const handleInterestRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    // Allow empty string or valid decimal numbers
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      // Store the raw input value
      setRawInputValues(prev => ({ ...prev, interestRate: rawValue }));

      if (rawValue === '') {
        setInterestRate(0);
      } else {
        const value = Number(rawValue);
        if (!isNaN(value) && value >= 0) {
          setInterestRate(value);
        }
        // Always update the raw input value even if validation fails
        // This allows typing partial decimals like "5.56" while typing "5.567"
      }
    }
  };

  const payment = calculateMonthlyPayment();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('calculators.mortgage_inputs')}</CardTitle>
          <CardDescription>
            {t('calculators.mortgage_inputs_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.home_price')}
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center mb-1">
              <div className="flex-1">
                <Slider
                  value={[homePrice]}
                  min={0}
                  max={5000000}
                  step={10000}
                  onValueChange={(values) => handleHomePriceChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="text"
                  value={focusedInput === 'homePrice' ? homePrice.toString() : homePrice.toLocaleString()}
                  onChange={handleHomePriceInputChange}
                  onFocus={() => setFocusedInput('homePrice')}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.down_payment')}
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center mb-1">
              <div className="flex-1">
                <Slider
                  value={[downPayment]}
                  min={0}
                  max={homePrice}
                  step={5000}
                  onValueChange={(values) => handleDownPaymentChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="text"
                  value={focusedInput === 'downPayment' ? downPayment.toString() : downPayment.toLocaleString()}
                  onChange={handleDownPaymentInputChange}
                  onFocus={() => setFocusedInput('downPayment')}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.down_payment_percent')}
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center mb-1">
              <div className="flex-1">
                <Slider
                  value={[downPaymentPercent]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(values) => handleDownPaymentPercentChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <Input
                  type="text"
                  value={focusedInput === 'downPaymentPercent' ? rawInputValues.downPaymentPercent : (Math.round(downPaymentPercent * 10) / 10).toFixed(1)}
                  onChange={handleDownPaymentPercentInputChange}
                  onFocus={() => setFocusedInput('downPaymentPercent')}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.loan_term_years')} {loanTerm} {t('calculators.years_button')}
            </label>
            <div className="flex gap-2">
              {[15, 20, 30].map(term => (
                <Button
                  key={term}
                  type="button"
                  variant={loanTerm === term ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setLoanTerm(term)}
                >
                  {term} {t('calculators.years_button')}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.interest_rate')}
            </label>
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center mb-1">
              <div className="flex-1">
                <Slider
                  value={[interestRate]}
                  min={0}
                  max={15}
                  step={0.125}
                  onValueChange={(values) => handleInterestRateChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <Input
                  type="text"
                  value={focusedInput === 'interestRate' ? rawInputValues.interestRate : (Math.round(interestRate * 1000) / 1000).toFixed(3)}
                  onChange={handleInterestRateInputChange}
                  onFocus={() => setFocusedInput('interestRate')}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.property_tax_yearly')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'propertyTax' ? propertyTax.toString() : propertyTax.toLocaleString()}
                onChange={handlePropertyTaxInputChange}
                onFocus={() => setFocusedInput('propertyTax')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
{t('calculators.homeowners_insurance')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'insurance' ? insurance.toString() : insurance.toLocaleString()}
                onChange={handleInsuranceInputChange}
                onFocus={() => setFocusedInput('insurance')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
{t('calculators.hoa_fees')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'hoa' ? hoa.toString() : hoa.toLocaleString()}
                onChange={handleHoaInputChange}
                onFocus={() => setFocusedInput('hoa')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('calculators.payment_breakdown')}</CardTitle>
          <CardDescription>
            {t('calculators.payment_breakdown_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">{t('calculators.monthly_payment')}</h3>
              <p className="text-gray-500">{t('calculators.total_payment_desc')}</p>
            </div>
            <div className="text-3xl font-bold text-[#1a1a1a]">
              ${isNaN(payment.total) ? "0.00" : payment.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.principal_interest')}</span>
              <span>${isNaN(payment.principalAndInterest) ? "0.00" : payment.principalAndInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.property_tax')}</span>
              <span>${payment.propertyTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.insurance')}</span>
              <span>${payment.insurance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.hoa_fees_short')}</span>
              <span>${payment.hoa.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('calculators.loan_amount')}</span>
              <span>${(homePrice - downPayment).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">{t('calculators.down_payment_display')}</span>
              <span>${downPayment.toLocaleString()} ({downPaymentPercent.toFixed(1)}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SellerProceedsCalculator = () => {
  const { t } = useTranslation();
  const [salePrice, setSalePrice] = useState(500000);
  const [mortgageBalance, setMortgageBalance] = useState(300000);
  const [agentCommission, setAgentCommission] = useState(6);
  const [closingCosts, setClosingCosts] = useState(5000);
  const [repairs, setRepairs] = useState(0);
  const [otherFees, setOtherFees] = useState(0);

  // Track input focus to prevent reformatting while typing
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Track raw input values for decimal inputs
  const [rawInputValues, setRawInputValues] = useState<{[key: string]: string}>({
    agentCommission: agentCommission.toString()
  });

  // Calculate proceeds
  const calculateProceeds = () => {
    const commissionAmount = (salePrice * agentCommission) / 100;
    const totalCosts = commissionAmount + closingCosts + repairs + otherFees + mortgageBalance;
    const netProceeds = salePrice - totalCosts;

    return {
      commissionAmount,
      totalCosts,
      netProceeds
    };
  };

  const handleSalePriceChange = (value: number) => {
    setSalePrice(value);
  };

  const handleSalePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setSalePrice(value);
    }
  };

  const handleMortgageBalanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setMortgageBalance(value);
    }
  };

  const handleClosingCostsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setClosingCosts(value);
    }
  };

  const handleRepairsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setRepairs(value);
    }
  };

  const handleOtherFeesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setOtherFees(value);
    }
  };

  const handleAgentCommissionChange = (value: number) => {
    setAgentCommission(value);
    setRawInputValues(prev => ({ ...prev, agentCommission: value.toString() }));
  };

  const handleAgentCommissionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    // Allow empty string or valid decimal numbers
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      // Store the raw input value
      setRawInputValues(prev => ({ ...prev, agentCommission: rawValue }));

      if (rawValue === '') {
        setAgentCommission(0);
      } else {
        const value = Number(rawValue);
        if (!isNaN(value) && value >= 0) {
          setAgentCommission(value);
        }
      }
    }
  };

  const proceeds = calculateProceeds();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('calculators.seller_proceeds_inputs')}</CardTitle>
          <CardDescription>
            {t('calculators.seller_proceeds_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.sale_price')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[salePrice]}
                  min={0}
                  max={5000000}
                  step={10000}
                  onValueChange={(values) => handleSalePriceChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="text"
                  value={focusedInput === 'salePrice' ? salePrice.toString() : salePrice.toLocaleString()}
                  onChange={handleSalePriceInputChange}
                  onFocus={() => setFocusedInput('salePrice')}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.remaining_mortgage')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'mortgageBalance' ? mortgageBalance.toString() : mortgageBalance.toLocaleString()}
                onChange={handleMortgageBalanceInputChange}
                onFocus={() => setFocusedInput('mortgageBalance')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.agent_commission')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[agentCommission]}
                  min={0}
                  max={10}
                  step={0.25}
                  onValueChange={(values) => handleAgentCommissionChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <Input
                  type="text"
                  value={focusedInput === 'agentCommission' ? rawInputValues.agentCommission : agentCommission.toFixed(2)}
                  onChange={handleAgentCommissionInputChange}
                  onFocus={() => setFocusedInput('agentCommission')}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.closing_costs')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'closingCosts' ? closingCosts.toString() : closingCosts.toLocaleString()}
                onChange={handleClosingCostsInputChange}
                onFocus={() => setFocusedInput('closingCosts')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.repair_costs')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'repairs' ? repairs.toString() : repairs.toLocaleString()}
                onChange={handleRepairsInputChange}
                onFocus={() => setFocusedInput('repairs')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.other_fees')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'otherFees' ? otherFees.toString() : otherFees.toLocaleString()}
                onChange={handleOtherFeesInputChange}
                onFocus={() => setFocusedInput('otherFees')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('calculators.seller_proceeds')}</CardTitle>
          <CardDescription>
            {t('calculators.estimated_proceeds')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">{t('calculators.net_proceeds')}</h3>
              <p className="text-gray-500">{t('calculators.estimated_closing')}</p>
            </div>
            <div className="text-3xl font-bold text-[#1a1a1a]">
              ${proceeds.netProceeds.toLocaleString()}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.sale_price_label')}</span>
              <span>${salePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.mortgage_balance')}</span>
              <span>- ${mortgageBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.agent_commission_label')} ({agentCommission}%)</span>
              <span>- ${proceeds.commissionAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.closing_costs_label')}</span>
              <span>- ${closingCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.repairs_label')}</span>
              <span>- ${repairs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.other_fees_label')}</span>
              <span>- ${otherFees.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>{t('calculators.note_label')}:</strong> {t('calculators.note_estimate')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RentalIncomeCalculator = () => {
  const { t } = useTranslation();
  const [purchasePrice, setPurchasePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [interestRate, setInterestRate] = useState(5.5);
  const [loanTerm, setLoanTerm] = useState(30);
  const [monthlyRent, setMonthlyRent] = useState(3000);
  const [vacancyRate, setVacancyRate] = useState(5);
  const [propertyTax, setPropertyTax] = useState(5000);
  const [insurance, setInsurance] = useState(1200);
  const [maintenance, setMaintenance] = useState(2400);
  const [propertyManagement, setPropertyManagement] = useState(10);
  const [utilities, setUtilities] = useState(0);

  // Track input focus to prevent reformatting while typing
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  // Track raw input values for decimal inputs
  const [rawInputValues, setRawInputValues] = useState<{[key: string]: string}>({
    interestRate: interestRate.toString(),
    vacancyRate: vacancyRate.toString(),
    propertyManagement: propertyManagement.toString()
  });

  // Calculate rental income
  const calculateRentalIncome = () => {
    const effectiveRent = monthlyRent * (1 - vacancyRate / 100);

    // Calculate mortgage payment
    const principal = purchasePrice - downPayment;
    const monthlyInterest = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const monthlyPrincipalAndInterest = (principal > 0 && monthlyInterest > 0)
      ? principal *
        (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) /
        (Math.pow(1 + monthlyInterest, numberOfPayments) - 1)
      : 0;

    const monthlyPropertyTax = propertyTax / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyMaintenance = maintenance / 12;
    const monthlyPropertyManagementFee = (monthlyRent * propertyManagement) / 100;

    const totalMonthlyExpenses =
      monthlyPrincipalAndInterest +
      monthlyPropertyTax +
      monthlyInsurance +
      monthlyMaintenance +
      monthlyPropertyManagementFee +
      utilities;

    const monthlyCashFlow = effectiveRent - totalMonthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCash = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;

    return {
      effectiveRent,
      monthlyPrincipalAndInterest,
      monthlyPropertyTax,
      monthlyInsurance,
      monthlyMaintenance,
      monthlyPropertyManagementFee,
      totalMonthlyExpenses,
      monthlyCashFlow,
      annualCashFlow,
      cashOnCash
    };
  };

  const handlePurchasePriceChange = (value: number) => {
    setPurchasePrice(value);
  };

  const handlePurchasePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setPurchasePrice(value);
    }
  };

  const handleDownPaymentChange = (value: number) => {
    setDownPayment(value);
  };

  const handleDownPaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setDownPayment(value);
    }
  };

  const handleInterestRateChange = (value: number) => {
    setInterestRate(value);
    setRawInputValues(prev => ({ ...prev, interestRate: value.toString() }));
  };

  const handleInterestRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    // Allow empty string or valid decimal numbers
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      // Store the raw input value
      setRawInputValues(prev => ({ ...prev, interestRate: rawValue }));

      if (rawValue === '') {
        setInterestRate(0);
      } else {
        const value = Number(rawValue);
        if (!isNaN(value) && value >= 0) {
          setInterestRate(value);
        }
      }
    }
  };

  const handleMonthlyRentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setMonthlyRent(value);
    }
  };

  const handlePropertyTaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setPropertyTax(value);
    }
  };

  const handleInsuranceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setInsurance(value);
    }
  };

  const handleMaintenanceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setMaintenance(value);
    }
  };

  const handleUtilitiesInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '');
    const value = Number(rawValue);
    if (!isNaN(value)) {
      setUtilities(value);
    }
  };

  const handleVacancyRateChange = (value: number) => {
    setVacancyRate(value);
    setRawInputValues(prev => ({ ...prev, vacancyRate: value.toString() }));
  };

  const handleVacancyRateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    // Allow empty string or valid decimal numbers
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      // Store the raw input value
      setRawInputValues(prev => ({ ...prev, vacancyRate: rawValue }));

      if (rawValue === '') {
        setVacancyRate(0);
      } else {
        const value = Number(rawValue);
        if (!isNaN(value) && value >= 0 && value <= 100) {
          setVacancyRate(value);
        }
      }
    }
  };

  const handlePropertyManagementChange = (value: number) => {
    setPropertyManagement(value);
    setRawInputValues(prev => ({ ...prev, propertyManagement: value.toString() }));
  };

  const handlePropertyManagementInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    // Allow empty string or valid decimal numbers
    if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
      // Store the raw input value
      setRawInputValues(prev => ({ ...prev, propertyManagement: rawValue }));

      if (rawValue === '') {
        setPropertyManagement(0);
      } else {
        const value = Number(rawValue);
        if (!isNaN(value) && value >= 0) {
          setPropertyManagement(value);
        }
      }
    }
  };

  const rentalCalc = calculateRentalIncome();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>{t('calculators.rental_inputs')}</CardTitle>
          <CardDescription>
            {t('calculators.rental_desc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.home_price')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[purchasePrice]}
                  min={0}
                  max={5000000}
                  step={10000}
                  onValueChange={(values) => handlePurchasePriceChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="text"
                  value={focusedInput === 'purchasePrice' ? purchasePrice.toString() : purchasePrice.toLocaleString()}
                  onChange={handlePurchasePriceInputChange}
                  onFocus={() => setFocusedInput('purchasePrice')}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.down_payment')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[downPayment]}
                  min={0}
                  max={purchasePrice}
                  step={5000}
                  onValueChange={(values) => handleDownPaymentChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="text"
                  value={focusedInput === 'downPayment' ? downPayment.toString() : downPayment.toLocaleString()}
                  onChange={handleDownPaymentInputChange}
                  onFocus={() => setFocusedInput('downPayment')}
                  onBlur={() => setFocusedInput(null)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.interest_rate')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[interestRate]}
                  min={0}
                  max={15}
                  step={0.125}
                  onValueChange={(values) => handleInterestRateChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <Input
                  type="text"
                  value={focusedInput === 'interestRate' ? rawInputValues.interestRate : interestRate.toFixed(3)}
                  onChange={handleInterestRateInputChange}
                  onFocus={() => setFocusedInput('interestRate')}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.loan_term_years')} {loanTerm} {t('calculators.years_button')}
            </label>
            <div className="flex gap-2">
              {[15, 20, 30].map(term => (
                <Button
                  key={term}
                  type="button"
                  variant={loanTerm === term ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setLoanTerm(term)}
                >
                  {term} {t('calculators.years_button')}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.monthly_rent')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'monthlyRent' ? monthlyRent.toString() : monthlyRent.toLocaleString()}
                onChange={handleMonthlyRentInputChange}
                onFocus={() => setFocusedInput('monthlyRent')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.vacancy_rate')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[vacancyRate]}
                  min={0}
                  max={30}
                  step={1}
                  onValueChange={(values) => handleVacancyRateChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <Input
                  type="text"
                  value={focusedInput === 'vacancyRate' ? rawInputValues.vacancyRate : vacancyRate.toFixed(1)}
                  onChange={handleVacancyRateInputChange}
                  onFocus={() => setFocusedInput('vacancyRate')}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.property_tax_yearly')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'propertyTax' ? propertyTax.toString() : propertyTax.toLocaleString()}
                onChange={handlePropertyTaxInputChange}
                onFocus={() => setFocusedInput('propertyTax')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.homeowners_insurance')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'insurance' ? insurance.toString() : insurance.toLocaleString()}
                onChange={handleInsuranceInputChange}
                onFocus={() => setFocusedInput('insurance')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.maintenance')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'maintenance' ? maintenance.toString() : maintenance.toLocaleString()}
                onChange={handleMaintenanceInputChange}
                onFocus={() => setFocusedInput('maintenance')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.property_management')}
            </label>
            <div className="flex gap-4 mb-1">
              <div className="flex-1">
                <Slider
                  value={[propertyManagement]}
                  min={0}
                  max={20}
                  step={0.5}
                  onValueChange={(values) => handlePropertyManagementChange(values[0])}
                />
              </div>
              <div className="relative w-36">
                <Input
                  type="text"
                  value={focusedInput === 'propertyManagement' ? rawInputValues.propertyManagement : propertyManagement.toFixed(1)}
                  onChange={handlePropertyManagementInputChange}
                  onFocus={() => setFocusedInput('propertyManagement')}
                  onBlur={() => setFocusedInput(null)}
                  className="pr-7"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calculators.utilities')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="text"
                value={focusedInput === 'utilities' ? utilities.toString() : utilities.toLocaleString()}
                onChange={handleUtilitiesInputChange}
                onFocus={() => setFocusedInput('utilities')}
                onBlur={() => setFocusedInput(null)}
                className="pl-7"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('calculators.rental_analysis')}</CardTitle>
          <CardDescription>
            {t('calculators.rental_returns')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">{t('calculators.monthly_cashflow')}</h3>
              <p className="text-gray-500">{t('calculators.income_after_expenses')}</p>
            </div>
            <div className={`text-3xl font-bold ${rentalCalc.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${rentalCalc.monthlyCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.monthly_rent_label')}</span>
              <span>${monthlyRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.vacancy_loss')} ({vacancyRate}%)</span>
              <span>- ${(monthlyRent * vacancyRate / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.effective_rent_label')}</span>
              <span>${rentalCalc.effectiveRent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t('calculators.monthly_expenses_title')}</h3>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.mortgage_payment_label')}</span>
              <span>${rentalCalc.monthlyPrincipalAndInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.property_tax_label')}</span>
              <span>${rentalCalc.monthlyPropertyTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.insurance_label')}</span>
              <span>${rentalCalc.monthlyInsurance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.maintenance_label')}</span>
              <span>${rentalCalc.monthlyMaintenance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.property_management_label')} ({propertyManagement}%)</span>
              <span>${rentalCalc.monthlyPropertyManagementFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.utilities_label')}</span>
              <span>${utilities.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2 font-bold">
              <span>{t('calculators.total_monthly_expenses')}</span>
              <span>${rentalCalc.totalMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">{t('calculators.investment_returns_title')}</h3>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.annual_cashflow_label')}</span>
              <span>${rentalCalc.annualCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">{t('calculators.cash_on_cash_label')}</span>
              <span className={rentalCalc.cashOnCash >= 0 ? 'text-green-600' : 'text-red-600'}>
                {rentalCalc.cashOnCash.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealEstateCalculators;
