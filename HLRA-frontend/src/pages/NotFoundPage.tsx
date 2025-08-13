import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, FileText, Upload, Search, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  const handleGoHome = () => {
    // In your actual app, use: navigate('/') or router.push('/')
  };

  const handleGoBack = () => {
    // In your actual app, use: navigate(-1) or router.back()
  };

  const quickActions = [
    {
      icon: Upload,
      title: "Upload Report",
      description: "Upload a new lab report for analysis",
      
    },
    {
      icon: FileText,
      title: "View Reports",
      description: "Check your previous lab reports",
      
    },
    {
      icon: Search,
      title: "Search",
      description: "Search through your health data",
      
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Illustration */}
        <div className="relative">
          <div className="text-8xl md:text-9xl font-bold text-gray-200 select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-blue-100 rounded-full p-6">
              <FileText className="h-16 w-16 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Oops! Page Not Found
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you're looking for seems to have wandered off. Let's get
            you back on track with your health journey.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleGoBack}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            onClick={handleGoHome}
            size="lg"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="pt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Or try one of these quick actions:
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-gray-200 hover:border-blue-300"
                  onClick={action.action}
                >
                  <CardContent className="p-6 text-center">
                    <div className="bg-blue-50 rounded-full p-3 w-fit mx-auto mb-3">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Additional Help */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Still having trouble?{" "}
            <button
              className="text-blue-600 hover:text-blue-700 underline"
              
            >
              Contact our support team
            </button>{" "}
            for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
