/**
 * Health Chat Page
 * AI-powered health chatbot interface
 */

import { Card } from '@/components/ui/card';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { Sparkles, Brain, Shield, Clock } from 'lucide-react';

const HealthChat = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Health Assistant
            </h1>
            <p className="text-muted-foreground">
              Get personalized insights about your health reports
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <ChatInterface />
          </Card>
        </div>

        {/* Sidebar - Features & Info */}
        <div className="space-y-4">
          {/* Features */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Capabilities
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded mt-0.5">
                  <Brain className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span>Analyzes your health reports and lab results</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="p-1 bg-purple-100 dark:bg-purple-900 rounded mt-0.5">
                  <Sparkles className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Explains medical terms in simple language</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="p-1 bg-green-100 dark:bg-green-900 rounded mt-0.5">
                  <Clock className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span>Tracks health trends over time</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="p-1 bg-orange-100 dark:bg-orange-900 rounded mt-0.5">
                  <Shield className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                </div>
                <span>Provides personalized health insights</span>
              </li>
            </ul>
          </Card>

          {/* Important Notice */}
          <Card className="p-6 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Shield className="h-5 w-5" />
              Important Notice
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              This AI assistant provides information and insights based on your health data.
              It is <strong>not a substitute for professional medical advice</strong>.
              Always consult with healthcare professionals for medical decisions.
            </p>
          </Card>

          {/* Tips */}
          <Card className="p-6">
            <h3 className="font-semibold mb-3">💡 Tips for Better Results</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Be specific in your questions</li>
              <li>• Ask about trends and patterns</li>
              <li>• Reference specific reports or dates</li>
              <li>• Ask for explanations of medical terms</li>
            </ul>
          </Card>

          {/* Privacy */}
          <Card className="p-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-green-900 dark:text-green-100">
              <Shield className="h-5 w-5" />
              Your Privacy
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Your conversations are private and secure. We use your health data
              only to provide personalized responses.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HealthChat;
