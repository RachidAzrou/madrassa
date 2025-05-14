import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface EnrollmentChartProps {
  className?: string;
}

type PeriodType = "monthly" | "quarterly" | "yearly";

export default function EnrollmentChart({ className }: EnrollmentChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("monthly");
  const [animateChart, setAnimateChart] = useState(false);

  // Chart data for different periods - in a real app, this would come from an API
  const chartData = {
    monthly: [65, 85, 75, 90, 95, 70, 60, 80, 85],
    quarterly: [70, 85, 92, 78],
    yearly: [60, 75, 82, 88, 90],
  };

  // Labels for different periods
  const chartLabels = {
    monthly: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
    quarterly: ["Q1", "Q2", "Q3", "Q4"],
    yearly: ["2019", "2020", "2021", "2022", "2023"],
  };

  const currentData = chartData[selectedPeriod];
  const currentLabels = chartLabels[selectedPeriod];

  // Animate chart when data changes
  useEffect(() => {
    setAnimateChart(false);
    const timer = setTimeout(() => setAnimateChart(true), 50);
    return () => clearTimeout(timer);
  }, [selectedPeriod]);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Enrollment Trends</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant={selectedPeriod === "monthly" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setSelectedPeriod("monthly")}
            >
              Monthly
            </Button>
            <Button 
              variant={selectedPeriod === "quarterly" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setSelectedPeriod("quarterly")}
            >
              Quarterly
            </Button>
            <Button 
              variant={selectedPeriod === "yearly" ? "secondary" : "outline"} 
              size="sm"
              onClick={() => setSelectedPeriod("yearly")}
            >
              Yearly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] relative">
          {currentData.map((value, index) => (
            <div
              key={index}
              className="chart-bar absolute bottom-0 bg-primary rounded-t-md transition-all duration-700 ease-out"
              style={{
                left: `${(index / currentData.length) * 100}%`,
                width: `${80 / currentData.length}%`,
                height: animateChart ? `${value}%` : "0%",
              }}
            />
          ))}
        </div>
        <div 
          className="grid text-xs text-muted-foreground mt-2"
          style={{ 
            gridTemplateColumns: `repeat(${currentLabels.length}, 1fr)` 
          }}
        >
          {currentLabels.map((label, index) => (
            <div key={index} className="text-center">{label}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
