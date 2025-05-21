import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Sample data for the chart
const monthlyData = [
  { name: "Jan", students: 65 },
  { name: "Feb", students: 85 },
  { name: "Mar", students: 75 },
  { name: "Apr", students: 90 },
  { name: "May", students: 95 },
  { name: "Jun", students: 70 },
  { name: "Jul", students: 60 },
  { name: "Aug", students: 80 },
  { name: "Sep", students: 85 },
];

const quarterlyData = [
  { name: "Q1", students: 225 },
  { name: "Q2", students: 255 },
  { name: "Q3", students: 205 },
  { name: "Q4", students: 310 },
];

const yearlyData = [
  { name: "2020", students: 850 },
  { name: "2021", students: 920 },
  { name: "2022", students: 995 },
  { name: "2023", students: 1080 },
];

type TimeFrame = "monthly" | "quarterly" | "yearly";

export default function EnrollmentChart() {
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("monthly");
  
  const data = 
    timeFrame === "monthly" ? monthlyData : 
    timeFrame === "quarterly" ? quarterlyData : 
    yearlyData;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-6">
        <CardTitle>Enrollment Trends</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeFrame === "monthly" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTimeFrame("monthly")}
          >
            Monthly
          </Button>
          <Button
            variant={timeFrame === "quarterly" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTimeFrame("quarterly")}
          >
            Quarterly
          </Button>
          <Button
            variant={timeFrame === "yearly" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setTimeFrame("yearly")}
          >
            Yearly
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{ 
                backgroundColor: "hsl(var(--background))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem"
              }}
              formatter={(value) => [`${value} students`, "Enrollment"]}
            />
            <Bar 
              dataKey="students" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={60} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
