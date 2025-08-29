import React, { createContext, useContext, useEffect, useState } from 'react';
import { familyProfileService } from '../services/familyProfileService';
import { FamilyProfile } from '../types/profile';
import { useAuth } from './AuthContext';

interface FamilyProfileContextType {
  profiles: FamilyProfile[];
  activeProfile: FamilyProfile | null;
  loading: boolean;
  switchProfile: (profileId: string) => Promise<FamilyProfile>;
  createProfile: (profileData: any) => Promise<FamilyProfile>;
  updateProfile: (profileId: string, updates: any) => FamilyProfile;
  deleteProfile: (profileId: string) => void;
  hasPermission: (permission: keyof FamilyProfile['permissions']) => Promise<boolean>;
  getHealthInsights: () => Promise<any>;
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
      const initializeProfiles = async () => {
        try {
          setLoading(true);
          
          // Subscribe to profile changes BEFORE initialization
          const unsubscribe = familyProfileService.subscribe((profileList, activeId) => {
            console.log('Profile subscription update:', { profileList, activeId });
            setProfiles(profileList);
            const active = profileList.find(p => p.id === activeId) || null;
            setActiveProfile(active);
            setLoading(false);
          });
          
          // Initialize service with backend sync - this will trigger subscriber notifications
          await familyProfileService.initialize(user.id);
          
          // Get initial data using async methods
          try {
            const initialProfiles = await familyProfileService.getProfiles();
            const initialActiveProfile = await familyProfileService.getActiveProfile();
            setProfiles(initialProfiles);
            setActiveProfile(initialActiveProfile);
          } catch (error) {
            console.warn('Error getting initial profile data:', error);
          }
          
          return unsubscribe;
        } catch (error) {
          console.error('Error initializing profiles:', error);
          setLoading(false);
        }
      };

      let unsubscribePromise = initializeProfiles();

      return () => {
        // Clean up subscription when component unmounts
        unsubscribePromise.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
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

  const hasPermission = async (permission: keyof FamilyProfile['permissions']) => {
    return await familyProfileService.hasPermission(permission);
  };

  const getHealthInsights = async () => {
    return await familyProfileService.getHealthInsights();
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