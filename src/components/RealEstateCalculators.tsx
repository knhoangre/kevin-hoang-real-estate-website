
import { useState } from "react";
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
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-[#1a1a1a] mb-8">REAL ESTATE CALCULATORS</h2>
        
        <Tabs defaultValue="mortgage">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
            <TabsTrigger value="mortgage">Mortgage Calculator</TabsTrigger>
            <TabsTrigger value="seller">Seller Proceeds</TabsTrigger>
            <TabsTrigger value="rental">Rental Income</TabsTrigger>
          </TabsList>
          
          <div className="mt-8">
            <TabsContent value="mortgage">
              <MortgageCalculator />
            </TabsContent>
            
            <TabsContent value="seller">
              <SellerProceedsCalculator />
            </TabsContent>
            
            <TabsContent value="rental">
              <RentalIncomeCalculator />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

const MortgageCalculator = () => {
  const [homePrice, setHomePrice] = useState(500000);
  const [downPayment, setDownPayment] = useState(100000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(5.5);
  const [propertyTax, setPropertyTax] = useState(5000);
  const [insurance, setInsurance] = useState(1200);
  const [hoa, setHoa] = useState(0);
  
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
  
  const handleHomepriceChange = (value: number) => {
    setHomePrice(value);
    setDownPayment((value * downPaymentPercent) / 100);
  };
  
  const handleDownPaymentChange = (value: number) => {
    setDownPayment(value);
    setDownPaymentPercent((value / homePrice) * 100);
  };
  
  const handleDownPaymentPercentChange = (value: number) => {
    setDownPaymentPercent(value);
    setDownPayment((homePrice * value) / 100);
  };
  
  const payment = calculateMonthlyPayment();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Inputs</CardTitle>
          <CardDescription>
            Adjust the values to calculate your monthly mortgage payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Home Price: ${homePrice.toLocaleString()}
            </label>
            <Slider
              value={[homePrice]}
              min={100000}
              max={2000000}
              step={10000}
              onValueChange={(values) => handleHomepriceChange(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$100k</span>
              <span>$2M</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Down Payment: ${downPayment.toLocaleString()} ({downPaymentPercent.toFixed(0)}%)
            </label>
            <Slider
              value={[downPayment]}
              min={0}
              max={homePrice}
              step={5000}
              onValueChange={(values) => handleDownPaymentChange(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>${homePrice.toLocaleString()}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Down Payment Percentage: {downPaymentPercent.toFixed(0)}%
            </label>
            <Slider
              value={[downPaymentPercent]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => handleDownPaymentPercentChange(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Loan Term: {loanTerm} years
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
                  {term} Years
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Interest Rate: {interestRate}%
            </label>
            <Slider
              value={[interestRate]}
              min={2}
              max={10}
              step={0.125}
              onValueChange={(values) => setInterestRate(values[0])}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>2%</span>
              <span>10%</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Property Tax (yearly)
            </label>
            <Input
              type="number"
              value={propertyTax}
              onChange={(e) => setPropertyTax(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Homeowner's Insurance (yearly)
            </label>
            <Input
              type="number"
              value={insurance}
              onChange={(e) => setInsurance(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              HOA Fees (monthly)
            </label>
            <Input
              type="number"
              value={hoa}
              onChange={(e) => setHoa(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment Breakdown</CardTitle>
          <CardDescription>
            Your estimated monthly mortgage payment details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">Monthly Payment</h3>
              <p className="text-gray-500">Total payment each month</p>
            </div>
            <div className="text-3xl font-bold text-[#1a1a1a]">
              ${payment.total.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Principal & Interest:</span>
              <span>${payment.principalAndInterest.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Property Tax:</span>
              <span>${payment.propertyTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Insurance:</span>
              <span>${payment.insurance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">HOA Fees:</span>
              <span>${payment.hoa.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Loan Amount:</span>
              <span>${(homePrice - downPayment).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Down Payment:</span>
              <span>${downPayment.toLocaleString()} ({downPaymentPercent.toFixed(0)}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const SellerProceedsCalculator = () => {
  const [salePrice, setSalePrice] = useState(500000);
  const [mortgageBalance, setMortgageBalance] = useState(300000);
  const [agentCommission, setAgentCommission] = useState(6);
  const [closingCosts, setClosingCosts] = useState(5000);
  const [repairs, setRepairs] = useState(0);
  const [otherFees, setOtherFees] = useState(0);
  
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
  
  const proceeds = calculateProceeds();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Seller Proceeds Inputs</CardTitle>
          <CardDescription>
            Calculate how much you'll receive after selling your home
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Sale Price: ${salePrice.toLocaleString()}
            </label>
            <Slider
              value={[salePrice]}
              min={100000}
              max={2000000}
              step={10000}
              onValueChange={(values) => setSalePrice(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Remaining Mortgage Balance
            </label>
            <Input
              type="number"
              value={mortgageBalance}
              onChange={(e) => setMortgageBalance(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Agent Commission: {agentCommission}%
            </label>
            <Slider
              value={[agentCommission]}
              min={0}
              max={7}
              step={0.5}
              onValueChange={(values) => setAgentCommission(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Closing Costs
            </label>
            <Input
              type="number"
              value={closingCosts}
              onChange={(e) => setClosingCosts(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Repair Costs
            </label>
            <Input
              type="number"
              value={repairs}
              onChange={(e) => setRepairs(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Other Fees
            </label>
            <Input
              type="number"
              value={otherFees}
              onChange={(e) => setOtherFees(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Seller Proceeds</CardTitle>
          <CardDescription>
            Your estimated proceeds from home sale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">Net Proceeds</h3>
              <p className="text-gray-500">Estimated cash at closing</p>
            </div>
            <div className="text-3xl font-bold text-[#1a1a1a]">
              ${proceeds.netProceeds.toLocaleString()}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Sale Price:</span>
              <span>${salePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Mortgage Balance:</span>
              <span>- ${mortgageBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Agent Commission ({agentCommission}%):</span>
              <span>- ${proceeds.commissionAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Closing Costs:</span>
              <span>- ${closingCosts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Repairs:</span>
              <span>- ${repairs.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Other Fees:</span>
              <span>- ${otherFees.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> This calculation is an estimate only. Actual fees and proceeds may vary.
              Consult with your real estate agent for a more accurate assessment of your specific situation.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RentalIncomeCalculator = () => {
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
  
  // Calculate rental income
  const calculateRentalIncome = () => {
    const effectiveRent = monthlyRent * (1 - vacancyRate / 100);
    
    // Calculate mortgage payment
    const principal = purchasePrice - downPayment;
    const monthlyInterest = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    const monthlyPrincipalAndInterest = 
      principal * 
      (monthlyInterest * Math.pow(1 + monthlyInterest, numberOfPayments)) / 
      (Math.pow(1 + monthlyInterest, numberOfPayments) - 1);
    
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
    const cashOnCash = (annualCashFlow / downPayment) * 100;
    
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
  
  const rentalCalc = calculateRentalIncome();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Rental Income Inputs</CardTitle>
          <CardDescription>
            Calculate potential returns on your investment property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">
              Purchase Price: ${purchasePrice.toLocaleString()}
            </label>
            <Slider
              value={[purchasePrice]}
              min={100000}
              max={2000000}
              step={10000}
              onValueChange={(values) => setPurchasePrice(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Down Payment: ${downPayment.toLocaleString()}
            </label>
            <Slider
              value={[downPayment]}
              min={0}
              max={purchasePrice}
              step={5000}
              onValueChange={(values) => setDownPayment(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Interest Rate: {interestRate}%
            </label>
            <Slider
              value={[interestRate]}
              min={2}
              max={10}
              step={0.125}
              onValueChange={(values) => setInterestRate(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Loan Term: {loanTerm} years
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
                  {term} Years
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Monthly Rent
            </label>
            <Input
              type="number"
              value={monthlyRent}
              onChange={(e) => setMonthlyRent(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Vacancy Rate: {vacancyRate}%
            </label>
            <Slider
              value={[vacancyRate]}
              min={0}
              max={20}
              step={1}
              onValueChange={(values) => setVacancyRate(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Property Tax (yearly)
            </label>
            <Input
              type="number"
              value={propertyTax}
              onChange={(e) => setPropertyTax(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Insurance (yearly)
            </label>
            <Input
              type="number"
              value={insurance}
              onChange={(e) => setInsurance(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Maintenance (yearly)
            </label>
            <Input
              type="number"
              value={maintenance}
              onChange={(e) => setMaintenance(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Property Management: {propertyManagement}%
            </label>
            <Slider
              value={[propertyManagement]}
              min={0}
              max={15}
              step={1}
              onValueChange={(values) => setPropertyManagement(values[0])}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Utilities (monthly)
            </label>
            <Input
              type="number"
              value={utilities}
              onChange={(e) => setUtilities(Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Rental Income Analysis</CardTitle>
          <CardDescription>
            Projected returns on your rental property
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-6 rounded-lg">
            <div>
              <h3 className="text-xl font-bold">Monthly Cash Flow</h3>
              <p className="text-gray-500">Income after all expenses</p>
            </div>
            <div className={`text-3xl font-bold ${rentalCalc.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${rentalCalc.monthlyCashFlow.toFixed(2)}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Monthly Rent:</span>
              <span>${monthlyRent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Vacancy Loss ({vacancyRate}%):</span>
              <span>- ${(monthlyRent * vacancyRate / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Effective Rent:</span>
              <span>${rentalCalc.effectiveRent.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Monthly Expenses</h3>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Mortgage Payment:</span>
              <span>${rentalCalc.monthlyPrincipalAndInterest.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Property Tax:</span>
              <span>${rentalCalc.monthlyPropertyTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Insurance:</span>
              <span>${rentalCalc.monthlyInsurance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Maintenance:</span>
              <span>${rentalCalc.monthlyMaintenance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Property Management ({propertyManagement}%):</span>
              <span>${rentalCalc.monthlyPropertyManagementFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Utilities:</span>
              <span>${utilities.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2 font-bold">
              <span>Total Monthly Expenses:</span>
              <span>${rentalCalc.totalMonthlyExpenses.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Investment Returns</h3>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Annual Cash Flow:</span>
              <span>${rentalCalc.annualCashFlow.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Cash-on-Cash Return:</span>
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
