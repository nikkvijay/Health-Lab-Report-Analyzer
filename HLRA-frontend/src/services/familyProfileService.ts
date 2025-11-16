import { FamilyProfile, ProfileSwitchData, RelationshipType, DEFAULT_PERMISSIONS } from '../types/profile';
import { notificationService } from './notificationService';
import { notify } from '../utils/notifications';
import { familyProfileAPI } from '../api/index';

class FamilyProfileService {
  private profiles: FamilyProfile[] = [];
  private activeProfileId: string | null = null;
  private subscribers: ((profiles: FamilyProfile[], activeId: string | null) => void)[] = [];
  private userId: string | null = null;
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private persistenceCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Don't load profiles here - wait for initialize() to be called with userId
  }

  // Initialize service for a user - idempotent and robust
  async initialize(userId: string): Promise<void> {
    // Prevent duplicate initialization
    if (this.isInitialized && this.userId === userId) {
      console.log('✅ Profile service already initialized for user:', userId);
      return;
    }
    
    // Return existing promise if initialization is in progress
    if (this.initializationPromise && this.userId === userId) {
      console.log('⏳ Profile service initialization in progress, waiting...');
      return this.initializationPromise;
    }
    
    // Create new initialization promise
    this.initializationPromise = this._doInitialize(userId);
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }
  
  private async _doInitialize(userId: string): Promise<void> {
    console.log('🔄 Initializing profile service for user:', userId);
    
    // Reset state for new user
    if (this.userId !== userId) {
      this.cleanup();
      this.userId = userId;
    }
    
    let profilesLoaded = false;
    
    try {
      // Strategy 1: Try to load from backend first
      console.log('📡 Attempting to load profiles from backend...');
      const backendProfiles = await familyProfileAPI.getProfiles();
      
      if (backendProfiles && backendProfiles.length > 0) {
        console.log(`✅ Loaded ${backendProfiles.length} profiles from backend`);
        this.profiles = backendProfiles.map(profile => this.transformBackendProfile(profile));
        profilesLoaded = true;
        
        // Try to load active profile from backend
        try {
          const backendActiveProfile = await familyProfileAPI.getActiveProfile();
          if (backendActiveProfile) {
            this.activeProfileId = backendActiveProfile.id;
            console.log(`✅ Set active profile from backend: ${backendActiveProfile.name}`);
          }
        } catch (error) {
          console.warn('⚠️ Could not load active profile from backend:', error);
        }
      }
    } catch (error) {
      console.warn('⚠️ Backend profile loading failed:', error);
    }
    
    // Strategy 2: If backend failed, try localStorage
    if (!profilesLoaded) {
      console.log('💾 Attempting to load profiles from localStorage...');
      this.loadProfiles();
      profilesLoaded = this.profiles.length > 0;
      
      if (profilesLoaded) {
        console.log(`✅ Loaded ${this.profiles.length} profiles from localStorage`);
        // Try to sync with backend in background
        this.syncWithBackendInBackground();
      }
    }
    
    // Strategy 3: If no profiles exist anywhere, create self profile
    if (!profilesLoaded || this.profiles.length === 0) {
      console.log('👤 No profiles found, creating self profile...');
      await this.createSelfProfile();
    } else {
      // Ensure we have an active profile
      if (!this.activeProfileId && this.profiles.length > 0) {
        const selfProfile = this.profiles.find(p => p.relationship === 'self');
        this.activeProfileId = selfProfile?.id || this.profiles[0].id;
        console.log(`✅ Set default active profile: ${this.activeProfileId}`);
      }
      
      // Save to localStorage for offline access with backup
      this.saveProfiles();
      
      // Verify persistence immediately
      this.verifyPersistence();
    }
    
    this.isInitialized = true;
    
    // Start persistence monitoring
    this.startPersistenceMonitoring();
    
    // Notify subscribers
    this.notifySubscribers();
    
    console.log('🎉 Profile service initialization complete');
  }

  // Background sync with backend (non-blocking)
  private async syncWithBackendInBackground() {
    try {
      console.log('🔄 Starting background sync with backend...');
      
      // Try to sync profiles
      const backendProfiles = await familyProfileAPI.getProfiles();
      if (backendProfiles && backendProfiles.length > 0) {
        const transformedProfiles = backendProfiles.map(profile => this.transformBackendProfile(profile));
        
        // Merge with local profiles (backend takes precedence)
        this.profiles = transformedProfiles;
        console.log(`✅ Background sync: updated with ${transformedProfiles.length} profiles from backend`);
        
        // Try to sync active profile
        const backendActiveProfile = await familyProfileAPI.getActiveProfile();
        if (backendActiveProfile) {
          this.activeProfileId = backendActiveProfile.id;
          console.log(`✅ Background sync: updated active profile`);
        }
        
        // Save updated data and notify
        this.saveProfiles();
        this.notifySubscribers();
      }
    } catch (error) {
      console.warn('⚠️ Background sync failed (non-critical):', error);
    }
  }
  
  // Ensure profiles are loaded - call this before any profile operations
  async ensureProfilesLoaded(): Promise<void> {
    if (!this.isInitialized || !this.userId) {
      console.warn('⚠️ Profile service not initialized. Service state:', {
        isInitialized: this.isInitialized,
        hasUserId: !!this.userId,
        profileCount: this.profiles.length
      });
      throw new Error('Profile service not initialized. Call initialize() first.');
    }
    
    // If no profiles loaded, try to load them
    if (this.profiles.length === 0) {
      console.log('⚠️ No profiles loaded, attempting recovery...');
      
      // Try localStorage first
      this.loadProfiles();
      
      // If still no profiles, try backend
      if (this.profiles.length === 0) {
        try {
          const backendProfiles = await familyProfileAPI.getProfiles();
          if (backendProfiles && backendProfiles.length > 0) {
            this.profiles = backendProfiles.map(profile => this.transformBackendProfile(profile));
            this.saveProfiles();
            console.log('✅ Recovery: loaded profiles from backend');
          }
        } catch (error) {
          console.warn('⚠️ Recovery failed, creating self profile:', error);
          await this.createSelfProfile();
        }
      }
      
      // Ensure we have an active profile
      if (!this.activeProfileId && this.profiles.length > 0) {
        const selfProfile = this.profiles.find(p => p.relationship === 'self');
        this.activeProfileId = selfProfile?.id || this.profiles[0].id;
        this.saveProfiles();
      }
      
      this.notifySubscribers();
    }
  }
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
        this.profiles = backendProfiles.map(profile => this.transformBackendProfile(profile));
        console.log(`✅ Refreshed ${this.profiles.length} profiles from backend`);
      }
      
      // Also refresh active profile
      const backendActiveProfile = await familyProfileAPI.getActiveProfile();
      if (backendActiveProfile) {
        this.activeProfileId = backendActiveProfile.id;
        console.log(`✅ Set active profile to: ${backendActiveProfile.name} (${backendActiveProfile.id})`);
      }
      
      // Notify subscribers of the updated state
      this.notifySubscribers();
      
    } catch (error) {
      console.error('❌ Failed to refresh profiles from backend:', error);
    }
  }

  // Transform backend profile data to frontend format
  private transformBackendProfile(backendProfile: any): FamilyProfile {
    return {
      id: backendProfile.id,
      userId: backendProfile.user_id,
      name: backendProfile.name,
      relationship: backendProfile.relationship,
      relationshipLabel: backendProfile.relationship_label,
      dateOfBirth: backendProfile.date_of_birth,
      gender: backendProfile.gender,
      bloodType: backendProfile.blood_type,
      avatar: backendProfile.avatar,
      isActive: backendProfile.is_active,
      createdAt: new Date(backendProfile.created_at),
      updatedAt: new Date(backendProfile.updated_at),
      healthInfo: {
        allergies: backendProfile.health_info?.allergies || [],
        medications: backendProfile.health_info?.medications || [],
        chronicConditions: backendProfile.health_info?.chronic_conditions || [],
        emergencyContact: backendProfile.emergency_contacts?.[0] ? {
          name: backendProfile.emergency_contacts[0].name,
          phone: backendProfile.emergency_contacts[0].phone,
          relationship: backendProfile.emergency_contacts[0].relationship
        } : undefined
      },
      permissions: {
        canViewReports: backendProfile.permissions?.can_view_reports ?? true,
        canUploadReports: backendProfile.permissions?.can_upload_reports ?? false,
        canShareReports: backendProfile.permissions?.can_share_reports ?? false,
        canModifyProfile: backendProfile.permissions?.can_manage_settings ?? false,
        canViewTrends: backendProfile.permissions?.can_view_reports ?? true
      },
      childSettings: backendProfile.child_settings ? {
        parentalControls: backendProfile.child_settings.parental_controls,
        restrictedSharing: backendProfile.child_settings.restricted_access,
        educationalMode: true,
        ageVerificationRequired: backendProfile.child_settings.age_verification
      } : undefined
    };
  }

  // Transform frontend profile data to backend format
  private transformToBackendFormat(profileData: any): any {
    // Clean up empty string values to avoid validation errors
    const cleanValue = (value: any) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      return value;
    };
    
    const transformed = {
      name: profileData.name,
      relationship_label: cleanValue(profileData.relationshipLabel),
      date_of_birth: cleanValue(profileData.dateOfBirth),
      gender: cleanValue(profileData.gender),
      blood_type: cleanValue(profileData.bloodType),
      phone: cleanValue(profileData.phone),
      email: cleanValue(profileData.email),
      address: cleanValue(profileData.address),
      notes: cleanValue(profileData.notes),
      health_info: {
        chronic_conditions: profileData.healthInfo?.chronicConditions || [],
        medications: profileData.healthInfo?.medications || [],
        allergies: profileData.healthInfo?.allergies || [],
        previous_surgeries: [],
        family_history: {},
        notes: null
      },
      emergency_contacts: profileData.healthInfo?.emergencyContact ? [{
        name: profileData.healthInfo.emergencyContact.name,
        phone: profileData.healthInfo.emergencyContact.phone,
        relationship: profileData.healthInfo.emergencyContact.relationship,
        email: null
      }] : []
    };
    
    // Remove undefined fields to avoid sending them to backend
    const cleanedTransformed: Record<string, any> = {};
    Object.keys(transformed).forEach(key => {
      if (transformed[key as keyof typeof transformed] !== undefined) {
        cleanedTransformed[key] = transformed[key as keyof typeof transformed];
      }
    });
    
    return cleanedTransformed;
  }
  private loadProfiles() {
    try {
      // Only attempt to load if userId is available
      if (!this.userId) {
        console.warn('Cannot load profiles: userId not set');
        return;
      }
      
      const primaryKey = `diagnosticdeck_family_profiles_${this.userId}`;
      const backupKey = `diagnosticdeck_profiles_backup_${this.userId}`;
      
      // Try to load from primary location
      let saved = localStorage.getItem(primaryKey);
      let source = 'primary';
      
      // If primary fails, try backup
      if (!saved) {
        saved = localStorage.getItem(backupKey);
        source = 'backup';
      }
      
      // If both fail, try global backup for this user
      if (!saved) {
        const globalBackup = localStorage.getItem('diagnosticdeck_profiles_last_backup');
        if (globalBackup) {
          const backup = JSON.parse(globalBackup);
          if (backup.userId === this.userId && backup.data) {
            saved = JSON.stringify(backup.data);
            source = 'global backup';
          }
        }
      }
      
      if (saved) {
        const data: ProfileSwitchData = JSON.parse(saved);
        this.profiles = data.profiles.map(profile => ({
          ...profile,
          createdAt: new Date(profile.createdAt),
          updatedAt: new Date(profile.updatedAt)
        }));
        this.activeProfileId = data.activeProfileId;
        console.log(`✅ Loaded ${this.profiles.length} profiles from localStorage (${source}) for user ${this.userId}`);
        
        // If we loaded from backup, also save to primary for future use
        if (source !== 'primary') {
          console.log('🔄 Restoring primary storage from backup...');
          this.saveProfiles();
        }
      }
    } catch (error) {
      console.error('Error loading family profiles:', error);
      
      // Final fallback - try to recover any profiles for this user
      this.attemptProfileRecovery();
    }
  }

  // Emergency profile recovery method
  private attemptProfileRecovery() {
    try {
      console.log('🆘 Attempting emergency profile recovery...');
      
      // Look for any profile-related data in localStorage
      const recoveredProfiles: FamilyProfile[] = [];
      
      Object.keys(localStorage).forEach(key => {
        if (key.includes('family_profiles') || key.includes('profiles_backup')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (data.profiles && Array.isArray(data.profiles)) {
              data.profiles.forEach((profile: any) => {
                if (profile.userId === this.userId || !profile.userId) {
                  // Convert dates
                  const recoveredProfile = {
                    ...profile,
                    userId: this.userId, // Ensure correct user ID
                    createdAt: new Date(profile.createdAt),
                    updatedAt: new Date(profile.updatedAt)
                  };
                  recoveredProfiles.push(recoveredProfile);
                }
              });
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      });
      
      // Remove duplicates based on profile ID
      const uniqueProfiles = recoveredProfiles.filter((profile, index, self) => 
        self.findIndex(p => p.id === profile.id) === index
      );
      
      if (uniqueProfiles.length > 0) {
        this.profiles = uniqueProfiles;
        // Set active profile to self if available, otherwise first profile
        const selfProfile = this.profiles.find(p => p.relationship === 'self');
        this.activeProfileId = selfProfile?.id || this.profiles[0].id;
        
        console.log(`✅ Recovery successful: restored ${uniqueProfiles.length} profiles`);
        this.saveProfiles(); // Save the recovered data
        return true;
      }
    } catch (error) {
      console.error('Profile recovery failed:', error);
    }
    
    return false;
  }

  // Verify that profiles are properly persisted
  private verifyPersistence() {
    try {
      if (!this.userId) return false;
      
      const primaryKey = `diagnosticdeck_family_profiles_${this.userId}`;
      const saved = localStorage.getItem(primaryKey);
      
      if (!saved) {
        console.warn('⚠️ Persistence verification failed - no data found, re-saving...');
        this.saveProfiles();
        return false;
      }
      
      const data = JSON.parse(saved);
      if (!data.profiles || data.profiles.length !== this.profiles.length) {
        console.warn('⚠️ Persistence verification failed - data mismatch, re-saving...');
        this.saveProfiles();
        return false;
      }
      
      console.log('✅ Persistence verification successful');
      return true;
    } catch (error) {
      console.error('Persistence verification error:', error);
      this.saveProfiles(); // Re-save on error
      return false;
    }
  }

  // Start monitoring persistence to prevent data loss
  private startPersistenceMonitoring() {
    // Check every 30 seconds
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
    }
    
    this.persistenceCheckInterval = setInterval(() => {
      if (this.isInitialized && this.userId && this.profiles.length > 0) {
        if (!this.verifyPersistence()) {
          console.warn('🚨 Persistence check failed, attempting recovery...');
          this.saveProfiles();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Stop persistence monitoring
  private stopPersistenceMonitoring() {
    if (this.persistenceCheckInterval) {
      clearInterval(this.persistenceCheckInterval);
      this.persistenceCheckInterval = null;
    }
  }

  // Save profiles to localStorage with backup mechanism
  private saveProfiles() {
    try {
      // Only attempt to save if userId is available
      if (!this.userId) {
        console.warn('Cannot save profiles: userId not set');
        return;
      }
      
      const data: ProfileSwitchData = {
        profiles: this.profiles,
        activeProfileId: this.activeProfileId || '',
        lastSwitched: new Date()
      };
      
      const primaryKey = `diagnosticdeck_family_profiles_${this.userId}`;
      const backupKey = `diagnosticdeck_profiles_backup_${this.userId}`;

      // Save to both primary and backup locations
      localStorage.setItem(primaryKey, JSON.stringify(data));
      localStorage.setItem(backupKey, JSON.stringify(data));

      // Also save a global backup without user ID for recovery
      localStorage.setItem('diagnosticdeck_profiles_last_backup', JSON.stringify({
        userId: this.userId,
        data,
        timestamp: Date.now()
      }));
      
      console.log(`✅ Saved ${this.profiles.length} profiles to localStorage (with backup) for user ${this.userId}`);
      this.notifySubscribers();
    } catch (error) {
      console.error('Error saving family profiles:', error);
    }
  }

  // Create default 'self' profile
  private async createSelfProfile() {
    if (!this.userId) return;

    const selfProfileData = {
      name: 'My Profile',
      relationshipLabel: 'Self',
      healthInfo: {
        allergies: [],
        medications: [],
        chronicConditions: []
      }
    };

    try {
      // Transform to backend format
      const backendData = this.transformToBackendFormat(selfProfileData);
      
      // Create profile in backend first
      const backendProfile = await familyProfileAPI.createProfile(backendData);
      
      // Transform response to frontend format
      const selfProfile = this.transformBackendProfile(backendProfile);
      
      this.profiles.push(selfProfile);
      this.activeProfileId = selfProfile.id;
      
      // Set as active profile in backend
      await familyProfileAPI.setActiveProfile(selfProfile.id);
      
      this.saveProfiles();

      // No notification for self profile creation - it's expected
    } catch (error) {
      console.error('Error creating self profile:', error);
      // Fall back to local-only profile if backend fails
      const fallbackProfile: FamilyProfile = {
        id: this.generateId(),
        userId: this.userId,
        name: 'My Profile',
        relationship: 'self',
        relationshipLabel: 'Self',
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
      
      this.profiles.push(fallbackProfile);
      this.activeProfileId = fallbackProfile.id;
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
    let permissions = DEFAULT_PERMISSIONS.family; // Use family as default
    if (profileData.relationship in DEFAULT_PERMISSIONS) {
      permissions = DEFAULT_PERMISSIONS[profileData.relationship as keyof typeof DEFAULT_PERMISSIONS];
    }

    // Add child-specific settings for minors (if needed in the future)
    let childSettings = undefined;

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
      // Transform frontend data to backend format
      const backendProfileData = this.transformToBackendFormat({
        ...profileData,
        healthInfo: profileData.healthInfo || { allergies: [], medications: [], chronicConditions: [] }
      });
      
      console.log('Sending profile data to backend:', backendProfileData);
      
      // Create profile in backend first
      const backendProfile = await familyProfileAPI.createProfile(backendProfileData);
      
      // Transform backend response to frontend format
      const createdProfile = this.transformBackendProfile(backendProfile);
      
      // Add to local profiles
      this.profiles.push(createdProfile);
      this.saveProfiles();

      // Only notify with toast, no persistent notification - and make it shorter
      notify.success(
        'Profile Created',
        `${createdProfile.name} added`
      );

      return createdProfile;
    } catch (error: any) {
      console.error('❌ Failed to create profile in backend:', error);
      
      // Log detailed error information for 422 errors
      if (error.response?.status === 422) {
        console.error('422 Validation Error Details:', {
          data: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers
        });
        
        const errorMessage = error.response?.data?.detail || 'Validation failed';
        notify.error('Profile Creation Failed', `Validation error: ${errorMessage}`);
      } else {
        notify.error('Profile Creation Failed', 'Unable to save profile to server. Please try again.');
      }
      
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

    notify.success('Profile Deleted', `${profile.name}'s profile has been removed`);
  }

  // Switch active profile
  async switchProfile(profileId: string) {
    const profile = this.profiles.find(p => p.id === profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const previousActiveId = this.activeProfileId;
    
    try {
      // Update local state first
      this.activeProfileId = profileId;
      
      // Call backend to persist active profile
      await familyProfileAPI.setActiveProfile(profileId);
      
      // Refresh profiles from backend to ensure sync
      await this.refreshProfilesFromBackend();
      
      // Save to localStorage
      this.saveProfiles();

      // Only show toast notification, no persistent notification - shorter message
      notify.info('Switched to ' + profile.name);

      return profile;
    } catch (error) {
      // Revert local state on error
      this.activeProfileId = previousActiveId;
      
      console.error('Failed to switch profile:', error);
      notify.error('Profile Switch Failed', 'Unable to switch profile. Please try again.');
      throw error;
    }
  }

  // Get all profiles
  async getProfiles(): Promise<FamilyProfile[]> {
    // If not initialized, return empty array to prevent errors
    if (!this.isInitialized) {
      console.warn('⚠️ getProfiles called before initialization, returning empty array');
      return [];
    }
    
    await this.ensureProfilesLoaded();
    return this.profiles;
  }

  // Get active profile
  async getActiveProfile(): Promise<FamilyProfile | null> {
    // If not initialized, return null to prevent errors
    if (!this.isInitialized) {
      console.warn('⚠️ getActiveProfile called before initialization, returning null');
      return null;
    }
    
    await this.ensureProfilesLoaded();
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

  // Get children profiles (for parental control) - based on age if date of birth is available
  getChildrenProfiles(): FamilyProfile[] {
    return this.profiles.filter(p => 
      p.dateOfBirth && this.calculateAge(p.dateOfBirth) < 18
    );
  }

  // Check if user has permission for current profile
  async hasPermission(permission: keyof FamilyProfile['permissions']): Promise<boolean> {
    const activeProfile = await this.getActiveProfile();
    if (!activeProfile) return false;
    
    return activeProfile.permissions[permission];
  }

  // Get health insights for active profile
  async getHealthInsights() {
    const activeProfile = await this.getActiveProfile();
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
    this.userId = null;
    this.isInitialized = false;
    this.initializationPromise = null;
    this.stopPersistenceMonitoring();
  }
}

// Export singleton instance
export const familyProfileService = new FamilyProfileService();
export default familyProfileService;