import React, { useState, useEffect } from 'react';
import { ChevronDown, Plus, Users, Settings, MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react';
import { useFormPersistence, useNetworkAwareSubmit } from '../../hooks/useFormPersistence';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Badge } from './badge';
import { Separator } from './separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Textarea } from './textarea';
import { familyProfileService } from '../../services/familyProfileService';
import { FamilyProfile, RelationshipType, getRelationshipDisplay, getRelationshipIcon } from '../../types/profile';
import { notify } from '../../utils/notifications';
import { calculateAge, toLocalDateString, formatDisplayDate } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileSwitcherProps {
  className?: string;
}

interface ProfileFormData {
  name: string;
  relationshipLabel?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies: string;
  medications: string;
  chronicConditions: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ className }) => {
  const { user, isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<FamilyProfile | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProfile, setEditingProfile] = useState<FamilyProfile | null>(null);
  const initialFormData: ProfileFormData = {
    name: '',
    relationshipLabel: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    allergies: '',
    medications: '',
    chronicConditions: '',
  };

  const {
    formData,
    updateFormData,
    isLoading: isPersistenceLoading,
    hasUnsavedChanges,
    handleSubmitSuccess,
    handleNetworkError,
    clearPersistedData,
  } = useFormPersistence(initialFormData, {
    key: editingProfile ? `edit_profile_${editingProfile.id}` : 'new_profile',
    clearOnSubmit: true,
    autoSave: true,
  });

  const { submitWithRetry, isSubmitting, submitError, clearError } = useNetworkAwareSubmit();

  // Declare state variables before useEffect
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchTimeoutId, setSwitchTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only initialize if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Subscribe to profile changes
    const unsubscribe = familyProfileService.subscribe((profileList, activeId) => {
      setProfiles(profileList);
      const active = profileList.find(p => p.id === activeId) || null;
      setActiveProfile(active);
    });

    // Initialize with current data
    setProfiles(familyProfileService.getProfiles());
    setActiveProfile(familyProfileService.getActiveProfile());

    return () => {
      unsubscribe();
      // Cleanup any pending timeouts
      if (switchTimeoutId) {
        clearTimeout(switchTimeoutId);
      }
    };
  }, [switchTimeoutId, isAuthenticated, user]);

  const handleSwitchProfile = (profileId: string) => {
    // Prevent rapid switching and race conditions
    if (isSwitching) {
      return;
    }
    
    // Clear any pending switches
    if (switchTimeoutId) {
      clearTimeout(switchTimeoutId);
      setSwitchTimeoutId(null);
    }
    
    // Debounce profile switching
    const timeoutId = setTimeout(async () => {
      setIsSwitching(true);
      try {
        await familyProfileService.switchProfile(profileId);
      } catch (error: any) {
        notify.error('Switch Failed', error.message);
      } finally {
        setIsSwitching(false);
        setSwitchTimeoutId(null);
      }
    }, 300); // 300ms debounce
    
    setSwitchTimeoutId(timeoutId);
  };

  const resetForm = () => {
    updateFormData(initialFormData);
    setEditingProfile(null);
    clearPersistedData();
    clearError();
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = (profile: FamilyProfile) => {
    updateFormData({
      name: profile.name,
      relationshipLabel: profile.relationshipLabel || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      bloodType: profile.bloodType || '',
      allergies: profile.healthInfo.allergies.join(', '),
      medications: profile.healthInfo.medications.join(', '),
      chronicConditions: profile.healthInfo.chronicConditions.join(', '),
      emergencyContactName: profile.healthInfo.emergencyContact?.name || '',
      emergencyContactPhone: profile.healthInfo.emergencyContact?.phone || '',
      emergencyContactRelationship: profile.healthInfo.emergencyContact?.relationship || '',
    });
    setEditingProfile(profile);
    setShowAddDialog(true);
  };

  const handleSubmit = async () => {
    // Ensure user is authenticated and available
    if (!isAuthenticated || !user) {
      notify.error('Authentication Error', 'Please log in to continue');
      return;
    }
    
    // Ensure the family profile service is initialized
    try {
      if (!familyProfileService.isInitialized || !familyProfileService.isInitialized()) {
        familyProfileService.initialize(user.id);
      }
    } catch (error) {
      // If isInitialized method doesn't exist, just try to initialize
      familyProfileService.initialize(user.id);
    }
    
    if (!formData.name.trim()) {
      notify.error('Validation Error', 'Name is required');
      return;
    }

    const profileData = {
      name: formData.name,
      relationshipLabel: formData.relationshipLabel,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender as any,
      bloodType: formData.bloodType as any,
      healthInfo: {
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(s => s),
        medications: formData.medications.split(',').map(s => s.trim()).filter(s => s),
        chronicConditions: formData.chronicConditions.split(',').map(s => s.trim()).filter(s => s),
        emergencyContact: formData.emergencyContactName ? {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone || '',
          relationship: formData.emergencyContactRelationship || '',
        } : undefined,
      },
      permissions: {
        canViewReports: true,
        canUploadReports: true,
        canShareReports: false,
        canModifyProfile: false,
        canViewTrends: true,
      }
    };

    try {
      await submitWithRetry(
        async () => {
          if (editingProfile) {
            return await familyProfileService.updateProfile(editingProfile.id, profileData);
          } else {
            return await familyProfileService.createProfile(profileData);
          }
        },
        {
          maxRetries: 3,
          retryDelay: 1000,
          onNetworkError: handleNetworkError,
          onSuccess: () => {
            handleSubmitSuccess();
            setShowAddDialog(false);
            resetForm();
            notify.success('Profile Saved', `Profile ${editingProfile ? 'updated' : 'created'} successfully`);
          }
        }
      );
    } catch (error: any) {
      // Error is already handled by submitWithRetry and displayed in submitError
      console.error('Profile submit error:', error);
    }
  };

  const handleDeleteProfile = (profile: FamilyProfile) => {
    if (profile.relationship === 'self') {
      notify.error('Cannot Delete', 'Cannot delete your own profile');
      return;
    }

    try {
      familyProfileService.deleteProfile(profile.id);
    } catch (error: any) {
      notify.error('Delete Failed', error.message);
    }
  };

  // Use imported calculateAge function instead of local implementation

  const getProfileDisplayInfo = (profile: FamilyProfile) => {
    const age = profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null;
    const relationship = getRelationshipDisplay(profile);
    
    return {
      displayName: profile.name,
      subtitle: age ? `${relationship}, ${age} years old` : relationship,
      icon: getRelationshipIcon(profile),
      initials: profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
    };
  };

  const activeProfileInfo = activeProfile ? getProfileDisplayInfo(activeProfile) : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={`flex items-center gap-3 p-2 h-auto ${className}`}>
            <Avatar className="w-8 h-8">
              <AvatarImage src={activeProfile?.avatar} />
              <AvatarFallback className="text-sm">
                {activeProfileInfo?.initials || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium">
                {activeProfileInfo?.displayName || 'Select Profile'}
              </span>
              <span className="text-xs text-slate-500">
                {activeProfileInfo?.subtitle || 'No active profile'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-80 p-2">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Users className="h-4 w-4 text-slate-600" />
            <span className="font-medium text-slate-700">Family Profiles</span>
            <Badge variant="secondary" className="ml-auto">
              {profiles.length}
            </Badge>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {profiles.map((profile) => {
              const info = getProfileDisplayInfo(profile);
              const isActive = activeProfile?.id === profile.id;

              return (
                <div key={profile.id} className="group relative">
                  <DropdownMenuItem
                    onClick={() => handleSwitchProfile(profile.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg ${
                      isActive ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="text-sm">
                        {info.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{info.displayName}</span>
                        <span className="text-lg">{info.icon}</span>
                        {isActive && (
                          <Badge className="bg-blue-600 text-white text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">{info.subtitle}</p>
                      {profile.healthInfo.chronicConditions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {profile.healthInfo.chronicConditions.slice(0, 2).map((condition, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                          {profile.healthInfo.chronicConditions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.healthInfo.chronicConditions.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {profile.relationship !== 'self' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(profile)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProfile(profile)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </DropdownMenuItem>
                </div>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem onClick={openAddDialog} className="flex items-center gap-2 p-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <Plus className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <span className="font-medium">Add Family Member</span>
              <p className="text-xs text-slate-500">Create a new profile</p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add/Edit Profile Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {editingProfile ? 'Edit Profile' : 'Add Family Member'}
            </DialogTitle>
            <DialogDescription>
              {editingProfile 
                ? 'Update family member information and health details'
                : 'Add a new family member to manage their health data'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData({name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationshipLabel">Relationship (optional)</Label>
                  <Input
                    id="relationshipLabel"
                    placeholder="e.g., Mother, Son, Best Friend, Doctor"
                    value={formData.relationshipLabel || ''}
                    onChange={(e) => updateFormData({relationshipLabel: e.target.value})}
                  />
                  <p className="text-xs text-slate-500">
                    Describe how this person is related to you (optional)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={toLocalDateString(formData.dateOfBirth)}
                    onChange={(e) => updateFormData({dateOfBirth: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => updateFormData({gender: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">Blood Type</Label>
                  <Select value={formData.bloodType} onValueChange={(value) => updateFormData({bloodType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Health Information */}
            <div className="space-y-4">
              <h4 className="font-medium">Health Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => updateFormData({allergies: e.target.value})}
                    placeholder="Enter allergies separated by commas"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => updateFormData({medications: e.target.value})}
                    placeholder="Enter medications separated by commas"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chronicConditions">Chronic Conditions</Label>
                  <Textarea
                    id="chronicConditions"
                    value={formData.chronicConditions}
                    onChange={(e) => updateFormData({chronicConditions: e.target.value})}
                    placeholder="Enter chronic conditions separated by commas"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="font-medium">Emergency Contact</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    value={formData.emergencyContactName || ''}
                    onChange={(e) => updateFormData({emergencyContactName: e.target.value})}
                    placeholder="Emergency contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Phone Number</Label>
                  <Input
                    id="emergencyContactPhone"
                    value={formData.emergencyContactPhone || ''}
                    onChange={(e) => updateFormData({emergencyContactPhone: e.target.value})}
                    placeholder="Phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship || ''}
                    onChange={(e) => updateFormData({emergencyContactRelationship: e.target.value})}
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingProfile ? 'Update Profile' : 'Add Profile'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileSwitcher;