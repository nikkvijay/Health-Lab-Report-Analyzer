import React, { createContext, useContext, useEffect, useState } from 'react';
import { familyProfileService } from '../services/familyProfileService';
import { FamilyProfile } from '../types/profile';
import { useAuth } from './AuthContext';

interface FamilyProfileContextType {
  profiles: FamilyProfile[];
  activeProfile: FamilyProfile | null;
  loading: boolean;
  switchProfile: (profileId: string) => void;
  createProfile: (profileData: any) => FamilyProfile;
  updateProfile: (profileId: string, updates: any) => FamilyProfile;
  deleteProfile: (profileId: string) => void;
  hasPermission: (permission: keyof FamilyProfile['permissions']) => boolean;
  getHealthInsights: () => any;
}

const FamilyProfileContext = createContext<FamilyProfileContextType | undefined>(undefined);

export const useFamilyProfiles = () => {
  const context = useContext(FamilyProfileContext);
  if (context === undefined) {
    throw new Error('useFamilyProfiles must be used within a FamilyProfileProvider');
  }
  return context;
};

interface FamilyProfileProviderProps {
  children: React.ReactNode;
}

export const FamilyProfileProvider: React.FC<FamilyProfileProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize the family profile service
      familyProfileService.initialize(user.id);

      // Subscribe to profile changes
      const unsubscribe = familyProfileService.subscribe((profileList, activeId) => {
        console.log('Profile subscription update:', { profileList, activeId });
        setProfiles(profileList);
        const active = profileList.find(p => p.id === activeId) || null;
        setActiveProfile(active);
        setLoading(false);
      });

      // Get initial data and ensure self profile exists
      const initializeProfiles = async () => {
        try {
          // Initialize service with backend sync
          await familyProfileService.initialize(user.id);
          
          let profiles = familyProfileService.getProfiles();
          
          // If no profiles exist, create self profile
          if (profiles.length === 0) {
            const selfProfile = await familyProfileService.createProfile({
              name: user.full_name || user.email,
              relationship: 'self',
              relationshipLabel: 'Self',
            });
            profiles = [selfProfile];
          }
          
          setProfiles(profiles);
          
          // Set active profile (should be self profile by default)
          const activeProfile = familyProfileService.getActiveProfile();
          setActiveProfile(activeProfile);
          
        } catch (error) {
          console.error('Error initializing profiles:', error);
        } finally {
          setLoading(false);
        }
      };

      initializeProfiles();

      return () => {
        unsubscribe();
      };
    } else {
      // Reset when user logs out
      setProfiles([]);
      setActiveProfile(null);
      setLoading(false);
      familyProfileService.cleanup();
    }
  }, [isAuthenticated, user]);

  const switchProfile = async (profileId: string) => {
    return await familyProfileService.switchProfile(profileId);
  };

  const createProfile = async (profileData: any) => {
    return await familyProfileService.createProfile(profileData);
  };

  const updateProfile = (profileId: string, updates: any) => {
    return familyProfileService.updateProfile(profileId, updates);
  };

  const deleteProfile = (profileId: string) => {
    return familyProfileService.deleteProfile(profileId);
  };

  const hasPermission = (permission: keyof FamilyProfile['permissions']) => {
    return familyProfileService.hasPermission(permission);
  };

  const getHealthInsights = () => {
    return familyProfileService.getHealthInsights();
  };

  // Emit custom event when active profile changes
  useEffect(() => {
    const event = new CustomEvent('activeProfileChanged', {
      detail: { activeProfileId: activeProfile?.id || null }
    });
    window.dispatchEvent(event);
  }, [activeProfile?.id]);

  const contextValue: FamilyProfileContextType = {
    profiles,
    activeProfile,
    loading,
    switchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
    hasPermission,
    getHealthInsights,
  };

  return (
    <FamilyProfileContext.Provider value={contextValue}>
      {children}
    </FamilyProfileContext.Provider>
  );
};