import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MousePointer, AlertTriangle } from "lucide-react";

interface CampaignMetricsProps {
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
}

const CampaignMetrics = ({
  totalRecipients,
  totalSent,
  totalOpened,
  totalClicked,
  totalBounced,
}: CampaignMetricsProps) => {
  const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0";
  const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : "0";
  const bounceRate = totalRecipients > 0 ? ((totalBounced / totalRecipients) * 100).toFixed(1) : "0";

  const chartData = [
    { name: "Enviados", value: totalSent },
    { name: "Abiertos", value: totalOpened },
    { name: "Clicks", value: totalClicked },
    { name: "Rebotados", value: totalBounced },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{openRate}%</p>
              <p className="text-xs text-muted-foreground">Tasa apertura</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MousePointer className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{clickRate}%</p>
              <p className="text-xs text-muted-foreground">Tasa clicks</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{bounceRate}%</p>
              <p className="text-xs text-muted-foreground">Tasa rebote</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalSent > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Desglose de envío</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CampaignMetrics;
