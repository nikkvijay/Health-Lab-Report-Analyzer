import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ThemeToggle } from '../ui/theme-toggle';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterCredentials } from '../../types';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData as RegisterCredentials);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Error handling is done in the AuthContext
    }
  };

  return (
    <div className="medical-auth-container min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 transition-colors duration-300">
      {/* Theme Toggle - Positioned absolutely in top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle 
          variant="outline" 
          size="default" 
          showLabel 
          className="bg-card/80 backdrop-blur-md border-border/50 hover:bg-card shadow-lg"
        />
      </div>

      <div className="auth-card w-full max-w-md">
        {/* Enhanced Medical Brand Header */}
        <div className="medical-brand text-center mb-8">
          <div className="brand-icon mx-auto h-16 w-16 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-800 rounded-xl flex items-center justify-center mb-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-medical-brand text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Join HLRA
          </h1>
          <p className="text-medical-note">
            Create your secure health profile
          </p>
        </div>

        <Card className="medical-auth-card shadow-xl border border-border/50 backdrop-blur-sm bg-card/95 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="medical-card-header space-y-1 text-center">
            <CardTitle className="text-clinical-title text-2xl font-bold text-foreground">
              Create Account
            </CardTitle>
            <CardDescription className="text-medical-note">
              Enter your information to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 h-12 bg-background border-border hover:border-border/80 focus:border-primary transition-all duration-200"
                    {...register('full_name')}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1 duration-200">{errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10 h-12 bg-background border-border hover:border-border/80 focus:border-primary transition-all duration-200"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1 duration-200">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    className="pl-10 pr-10 h-12 bg-background border-border hover:border-border/80 focus:border-primary transition-all duration-200"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1 duration-200">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 h-12 bg-background border-border hover:border-border/80 focus:border-primary transition-all duration-200"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive animate-in slide-in-from-top-1 duration-200">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-base bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-primary hover:text-primary/80 font-medium hover:underline transition-all duration-200"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground/80">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;