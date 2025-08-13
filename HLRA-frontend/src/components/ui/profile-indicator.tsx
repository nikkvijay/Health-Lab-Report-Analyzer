import React from 'react';
import { Card, CardContent } from './card';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Button } from './button';
import { useFamilyProfiles } from '../../contexts/FamilyProfileContext';
import { getRelationshipDisplay, getRelationshipIcon } from '../../types/profile';
import { Heart, Shield, Users, Calendar, AlertTriangle } from 'lucide-react';

interface ProfileIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

const ProfileIndicator: React.FC<ProfileIndicatorProps> = ({ showDetails = true, className }) => {
  const { activeProfile, profiles, getHealthInsights } = useFamilyProfiles();

  if (!activeProfile) {
    return (
      <Card className={`border-dashed border-2 ${className}`}>
        <CardContent className="p-4 text-center text-slate-500">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No active profile</p>
          <p className="text-xs mt-1">Select a family member to continue</p>
        </CardContent>
      </Card>
    );
  }

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = activeProfile.dateOfBirth ? calculateAge(activeProfile.dateOfBirth) : null;
  const relationship = getRelationshipDisplay(activeProfile);
  const icon = getRelationshipIcon(activeProfile);
  const initials = activeProfile.name.split(' ').map(n => n[0]).join('').toUpperCase();
  
  const healthInsights = getHealthInsights();
  const riskFactors = healthInsights?.riskFactors || [];

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={activeProfile.avatar} />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{activeProfile.name}</h3>
              <span className="text-xl">{icon}</span>
              {activeProfile.relationship === 'self' && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">You</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>{relationship}</span>
              {age && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {age} years old
                  </span>
                </>
              )}
              {activeProfile.bloodType && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {activeProfile.bloodType}
                  </span>
                </>
              )}
            </div>

            {showDetails && (
              <div className="mt-3 space-y-2">
                {/* Health Conditions */}
                {activeProfile.healthInfo.chronicConditions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeProfile.healthInfo.chronicConditions.slice(0, 3).map((condition, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {condition}
                      </Badge>
                    ))}
                    {activeProfile.healthInfo.chronicConditions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{activeProfile.healthInfo.chronicConditions.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Risk Factors */}
                {riskFactors.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span>{riskFactors.length} health consideration(s)</span>
                  </div>
                )}

                {/* Permissions */}
                {activeProfile.relationship !== 'self' && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Shield className="h-3 w-3" />
                    <span>
                      {activeProfile.permissions.canUploadReports ? 'Can manage' : 'View only'} • 
                      {activeProfile.childSettings?.parentalControls ? ' Parental controls' : ' Full access'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Family Count */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{profiles.length}</div>
            <div className="text-xs text-slate-500">
              {profiles.length === 1 ? 'Profile' : 'Profiles'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileIndicator;