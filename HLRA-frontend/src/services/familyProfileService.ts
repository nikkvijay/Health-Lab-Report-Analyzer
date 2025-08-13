import { FamilyProfile, ProfileSwitchData, RelationshipType, DEFAULT_PERMISSIONS } from '../types/profile';
import { notificationService } from './notificationService';
import { notify } from '../utils/notifications';
import { familyProfileAPI } from '../api/index';

class FamilyProfileService {
  private profiles: FamilyProfile[] = [];
  private activeProfileId: string | null = null;
  private subscribers: ((profiles: FamilyProfile[], activeId: string | null) => void)[] = [];
  private userId: string | null = null;

  constructor() {
    this.loadProfiles();
  }

  // Initialize service for a user
  async initialize(userId: string) {
    this.userId = userId;
    
    try {
      // Load profiles from backend first
      const backendProfiles = await familyProfileAPI.getProfiles();
      
      if (backendProfiles && backendProfiles.length > 0) {
        this.profiles = backendProfiles.map(profile => ({
          ...profile,
          createdAt: new Date(profile.created_at || profile.createdAt),
          updatedAt: new Date(profile.updated_at || profile.updatedAt)
        }));
      } else {
        this.loadProfiles(); // Fallback to localStorage
      }
      
      // Load active profile from backend
      const backendActiveProfile = await familyProfileAPI.getActiveProfile();
      if (backendActiveProfile) {
        this.activeProfileId = backendActiveProfile.id;
      } else if (this.profiles.length > 0) {
        // Fallback to first profile if no active profile set
        this.activeProfileId = this.profiles[0].id;
      }
      
    } catch (error) {
      console.log('❌ Could not load profiles from backend, using localStorage:', error);
      this.loadProfiles(); // Fallback to localStorage
    }
    
    // Create default 'self' profile if none exists
    if (this.profiles.length === 0) {
      await this.createSelfProfile();
    } else {
      // Save profiles to localStorage for offline access
      this.saveProfiles();
    }
  }

  // Subscribe to profile changes
  subscribe(callback: (profiles: FamilyProfile[], activeId: string | null) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.profiles, this.activeProfileId));
  }

  // Refresh profiles from backend
  private async refreshProfilesFromBackend() {
    try {
      const backendProfiles = await familyProfileAPI.getProfiles();
      
      if (backendProfiles && backendProfiles.length > 0) {
        this.profiles = backendProfiles.map(profile => ({
          ...profile,
          createdAt: new Date(profile.created_at || profile.createdAt),
          updatedAt: new Date(profile.updated_at || profile.updatedAt)
        }));
      }
      
      // Also refresh active profile
      const backendActiveProfile = await familyProfileAPI.getActiveProfile();
      if (backendActiveProfile) {
        this.activeProfileId = backendActiveProfile.id;
      }
      
    } catch (error) {
      console.error('❌ Failed to refresh profiles from backend:', error);
    }
  }

  // Load profiles from localStorage
  private loadProfiles() {
    try {
      const saved = localStorage.getItem(`hlra_family_profiles_${this.userId}`);
      if (saved) {
        const data: ProfileSwitchData = JSON.parse(saved);
        this.profiles = data.profiles.map(profile => ({
          ...profile,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt)
        }));
        this.activeProfileId = data.activeProfileId;
      }
    } catch (error) {
      console.error('Error loading family profiles:', error);
    }
  }

  // Save profiles to localStorage
  private saveProfiles() {
    try {
      const data: ProfileSwitchData = {
        profiles: this.profiles,
        activeProfileId: this.activeProfileId || '',
        lastSwitched: new Date()
      };
      localStorage.setItem(`hlra_family_profiles_${this.userId}`, JSON.stringify(data));
      this.notifySubscribers();
    } catch (error) {
      console.error('Error saving family profiles:', error);
    }
  }

  // Create default 'self' profile
  private async createSelfProfile() {
    if (!this.userId) return;

    const selfProfile: FamilyProfile = {
      id: this.generateId(),
      userId: this.userId,
      name: 'My Profile',
      relationship: 'self',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      healthInfo: {
        allergies: [],
        medications: [],
        chronicConditions: []
      },
      permissions: DEFAULT_PERMISSIONS.self
    };

    try {
      // Create profile in backend first
      await familyProfileAPI.createProfile(selfProfile);
      
      this.profiles.push(selfProfile);
      this.activeProfileId = selfProfile.id;
      
      // Set as active profile in backend
      await familyProfileAPI.setActiveProfile(selfProfile.id);
      
      this.saveProfiles();

      // No notification for self profile creation - it's expected
    } catch (error) {
      console.error('Error creating self profile:', error);
      // Fall back to local-only profile if backend fails
      this.profiles.push(selfProfile);
      this.activeProfileId = selfProfile.id;
      this.saveProfiles();
    }
  }

  // Generate unique ID
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Calculate age from date of birth
  private calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // Create a new family profile
  async createProfile(profileData: Omit<FamilyProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isActive'>) {
    if (!this.userId) {
      throw new Error('User not initialized');
    }

    // Auto-assign permissions based on relationship
    let permissions = DEFAULT_PERMISSIONS.default;
    if (profileData.relationship in DEFAULT_PERMISSIONS) {
      permissions = DEFAULT_PERMISSIONS[profileData.relationship as keyof typeof DEFAULT_PERMISSIONS];
    }

    // Add child-specific settings for minors
    let childSettings = undefined;
    if (profileData.relationship === 'child' && profileData.dateOfBirth) {
      const age = this.calculateAge(profileData.dateOfBirth);
      if (age < 18) {
        childSettings = {
          parentalControls: true,
          restrictedSharing: true,
          educationalMode: age < 12,
          ageVerificationRequired: age >= 13
        };
      }
    }

    const newProfile: FamilyProfile = {
      ...profileData,
      id: this.generateId(),
      userId: this.userId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: { ...permissions },
      childSettings
    };

    try {
      // Create profile in backend first
      const backendProfile = await familyProfileAPI.createProfile(newProfile);
      
      // Refresh all profiles from backend to ensure we have the complete list
      await this.refreshProfilesFromBackend();
      this.saveProfiles();

      // Find the created profile in the refreshed list
      const createdProfile = this.profiles.find(p => p.name === newProfile.name && p.relationship === newProfile.relationship);
      
      // Only notify with toast, no persistent notification
      notify.success(
        'Profile Created',
        `Added ${newProfile.name} to your family profiles`
      );

      return createdProfile || backendProfile;
    } catch (error) {
      console.error('❌ Failed to create profile in backend:', error);
      notify.error('Profile Creation Failed', 'Unable to save profile to server. Please try again.');
      throw error;
    }
  }

  // Update an existing profile
  updateProfile(profileId: string, updates: Partial<FamilyProfile>) {
    const profileIndex = this.profiles.findIndex(p => p.id === profileId);
    if (profileIndex === -1) {
      throw new Error('Profile not found');
    }

    // Don't allow changing critical fields
    const { id, userId, createdAt, ...allowedUpdates } = updates;

    this.profiles[profileIndex] = {
      ...this.profiles[profileIndex],
      ...allowedUpdates,
      updatedAt: new Date()
    };

    this.saveProfiles();

    notify.success(
      'Profile Updated',
      `${this.profiles[profileIndex].name}'s profile has been updated`
    );

    return this.profiles[profileIndex];
  }

  // Delete a profile
  deleteProfile(profileId: string) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Can't delete self profile
    if (profile.relationship === 'self') {
      throw new Error('Cannot delete your own profile');
    }

    this.profiles = this.profiles.filter(p => p.id !== profileId);

    // If deleting active profile, switch to self
    if (this.activeProfileId === profileId) {
      const selfProfile = this.profiles.find(p => p.relationship === 'self');
      this.activeProfileId = selfProfile?.id || null;
    }

    this.saveProfiles();

    notificationService.addNotification({
      type: 'system',
      title: 'Profile Deleted',
      message: `${profile.name}'s profile has been removed from your family`
    });

    notify.success('Profile Deleted', `${profile.name}'s profile has been removed`);
  }

  // Switch active profile
  async switchProfile(profileId: string) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    try {
      // Call backend to persist active profile
      await familyProfileAPI.setActiveProfile(profileId);
      
      // Refresh profiles from backend to ensure sync
      await this.refreshProfilesFromBackend();
      this.saveProfiles();

      // Only show toast notification, no persistent notification
      notify.info('Profile Switched', `Now managing ${profile.name}'s health data`);

      return profile;
    } catch (error) {
      console.error('Failed to switch profile:', error);
      notify.error('Profile Switch Failed', 'Unable to switch profile. Please try again.');
      throw error;
    }
  }

  // Get all profiles
  getProfiles(): FamilyProfile[] {
    return this.profiles;
  }

  // Get active profile
  getActiveProfile(): FamilyProfile | null {
    if (!this.activeProfileId) return null;
    return this.profiles.find(p => p.id === this.activeProfileId) || null;
  }

  // Get profile by ID
  getProfile(profileId: string): FamilyProfile | null {
    return this.profiles.find(p => p.id === profileId) || null;
  }

  // Get profiles by relationship
  getProfilesByRelationship(relationship: RelationshipType): FamilyProfile[] {
    return this.profiles.filter(p => p.relationship === relationship);
  }

  // Get children profiles (for parental control)
  getChildrenProfiles(): FamilyProfile[] {
    return this.profiles.filter(p => 
      p.relationship === 'child' || 
      (p.dateOfBirth && this.calculateAge(p.dateOfBirth) < 18)
    );
  }

  // Check if user has permission for current profile
  hasPermission(permission: keyof FamilyProfile['permissions']): boolean {
    const activeProfile = this.getActiveProfile();
    if (!activeProfile) return false;
    
    return activeProfile.permissions[permission];
  }

  // Get health insights for active profile
  getHealthInsights() {
    const activeProfile = this.getActiveProfile();
    if (!activeProfile) return null;

    const insights = {
      profile: activeProfile,
      age: activeProfile.dateOfBirth ? this.calculateAge(activeProfile.dateOfBirth) : null,
      riskFactors: this.calculateRiskFactors(activeProfile),
      recommendations: this.generateRecommendations(activeProfile)
    };

    return insights;
  }

  // Calculate risk factors based on profile data
  private calculateRiskFactors(profile: FamilyProfile): string[] {
    const risks: string[] = [];

    // Age-based risks
    if (profile.dateOfBirth) {
      const age = this.calculateAge(profile.dateOfBirth);
      if (age > 65) {
        risks.push('Senior age group - increased monitoring recommended');
      }
      if (age < 2) {
        risks.push('Infant - requires specialized pediatric care');
      }
    }

    // Chronic conditions
    if (profile.healthInfo.chronicConditions.length > 0) {
      risks.push(`Has ${profile.healthInfo.chronicConditions.length} chronic condition(s)`);
    }

    // Medications
    if (profile.healthInfo.medications.length > 3) {
      risks.push('Multiple medications - drug interaction monitoring recommended');
    }

    // Allergies
    if (profile.healthInfo.allergies.length > 0) {
      risks.push(`Has ${profile.healthInfo.allergies.length} known allergie(s)`);
    }

    return risks;
  }

  // Generate health recommendations
  private generateRecommendations(profile: FamilyProfile): string[] {
    const recommendations: string[] = [];

    // Age-based recommendations
    if (profile.dateOfBirth) {
      const age = this.calculateAge(profile.dateOfBirth);
      
      if (age >= 40 && age < 65) {
        recommendations.push('Consider annual comprehensive health screenings');
      }
      if (age >= 65) {
        recommendations.push('Senior health monitoring - more frequent checkups recommended');
      }
      if (age < 18) {
        recommendations.push('Pediatric care - growth and development tracking important');
      }
    }

    // Gender-specific recommendations
    if (profile.gender === 'female' && profile.dateOfBirth) {
      const age = this.calculateAge(profile.dateOfBirth);
      if (age >= 21) {
        recommendations.push('Regular gynecological screenings recommended');
      }
      if (age >= 40) {
        recommendations.push('Consider mammography screening');
      }
    }

    // General recommendations
    if (!profile.healthInfo.primaryDoctor) {
      recommendations.push('Consider establishing a primary healthcare provider');
    }

    if (!profile.healthInfo.emergencyContact) {
      recommendations.push('Add emergency contact information for safety');
    }

    return recommendations;
  }

  // Export profile data
  exportProfileData(profileId?: string) {
    const profiles = profileId 
      ? [this.getProfile(profileId)].filter(Boolean)
      : this.profiles;

    const exportData = {
      exportDate: new Date().toISOString(),
      profiles: profiles.map(profile => ({
        ...profile,
        // Remove sensitive system data
        userId: '[REDACTED]',
        createdAt: profile?.createdAt.toISOString(),
        updatedAt: profile?.updatedAt.toISOString()
      }))
    };

    return exportData;
  }

  // Import profile data
  importProfileData(data: any) {
    // Validation and import logic
    try {
      if (!data.profiles || !Array.isArray(data.profiles)) {
        throw new Error('Invalid import data format');
      }

      let importedCount = 0;
      
      data.profiles.forEach((profileData: any) => {
        // Skip if profile already exists (by name and relationship)
        const existingProfile = this.profiles.find(p => 
          p.name === profileData.name && 
          p.relationship === profileData.relationship
        );

        if (!existingProfile) {
          try {
            this.createProfile({
              ...profileData,
              createdAt: undefined,
              updatedAt: undefined,
              id: undefined,
              userId: undefined
            });
            importedCount++;
          } catch (error) {
            console.error('Error importing profile:', profileData.name, error);
          }
        }
      });

      if (importedCount > 0) {
        notify.success(
          'Profiles Imported',
          `Successfully imported ${importedCount} family profile(s)`
        );
      } else {
        notify.info('Import Complete', 'No new profiles to import');
      }

      return importedCount;
    } catch (error) {
      notify.error('Import Failed', 'Invalid profile data format');
      throw error;
    }
  }

  // Cleanup
  cleanup() {
    this.profiles = [];
    this.activeProfileId = null;
    this.subscribers = [];
  }
}

// Export singleton instance
export const familyProfileService = new FamilyProfileService();
export default familyProfileService;