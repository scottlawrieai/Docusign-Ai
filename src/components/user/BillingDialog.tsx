import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, Check, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

const BillingDialog = ({ open, onOpenChange }: BillingDialogProps) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(false);

  const plans: PlanOption[] = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Basic features for individuals",
      features: [
        "5 documents per month",
        "2 signatures per document",
        "Basic templates",
        "7-day document history",
      ],
    },
    {
      id: "pro",
      name: "Professional",
      price: "$12",
      description: "Advanced features for professionals",
      features: [
        "Unlimited documents",
        "Unlimited signatures",
        "Custom templates",
        "30-day document history",
        "Priority support",
      ],
      popular: true,
    },
    {
      id: "business",
      name: "Business",
      price: "$29",
      description: "Enterprise-grade features for teams",
      features: [
        "Everything in Professional",
        "Team management",
        "Advanced security",
        "API access",
        "Custom branding",
        "Unlimited history",
      ],
    },
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;

    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setCurrentPlan(planId);
      toast({
        title: "Plan updated",
        description: `You have successfully upgraded to the ${plans.find((p) => p.id === planId)?.name} plan.`,
      });
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast({
        title: "Error upgrading plan",
        description:
          "There was a problem upgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Billing & Plans
          </DialogTitle>
          <DialogDescription>
            Manage your subscription and billing information
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Current Plan</h3>
              <p className="text-sm text-muted-foreground">
                You are currently on the{" "}
                {plans.find((p) => p.id === currentPlan)?.name} plan
              </p>
            </div>
            <Badge variant={currentPlan === "free" ? "outline" : "default"}>
              {plans.find((p) => p.id === currentPlan)?.name}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`${plan.popular ? "border-primary" : ""}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </div>
                    {plan.popular && (
                      <Badge className="bg-primary">Popular</Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.id === currentPlan ? "outline" : "default"}
                    disabled={plan.id === currentPlan || isLoading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {plan.id === currentPlan ? "Current Plan" : "Upgrade"}
                    {plan.id !== currentPlan && (
                      <ArrowRight className="ml-2 h-4 w-4" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Payment Method</h3>

            {currentPlan === "free" ? (
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm">
                  No payment method required for the Free plan.
                </p>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-muted/50 flex justify-between items-center">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  <div>
                    <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                    <p className="text-xs text-muted-foreground">
                      Expires 12/2025
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Update
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Billing History</h3>

            {currentPlan === "free" ? (
              <div className="p-4 border rounded-md bg-muted/50">
                <p className="text-sm">
                  No billing history available for the Free plan.
                </p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">
                        Date
                      </th>
                      <th className="text-left p-3 text-sm font-medium">
                        Description
                      </th>
                      <th className="text-right p-3 text-sm font-medium">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3 text-sm">Jun 1, 2023</td>
                      <td className="p-3 text-sm">
                        {plans.find((p) => p.id === currentPlan)?.name} Plan -
                        Monthly
                      </td>
                      <td className="p-3 text-sm text-right">
                        {plans.find((p) => p.id === currentPlan)?.price}
                      </td>
                    </tr>
                    <tr className="border-t">
                      <td className="p-3 text-sm">May 1, 2023</td>
                      <td className="p-3 text-sm">
                        {plans.find((p) => p.id === currentPlan)?.name} Plan -
                        Monthly
                      </td>
                      <td className="p-3 text-sm text-right">
                        {plans.find((p) => p.id === currentPlan)?.price}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BillingDialog;
