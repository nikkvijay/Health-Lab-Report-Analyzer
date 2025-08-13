export interface FamilyProfile {
  id: string;
  userId: string; // Owner of this profile
  name: string; // User-defined name (e.g., "Mom", "John", "My Daughter")
  relationship: 'self' | 'family'; // System relationship type
  relationshipLabel?: string; // User-defined relationship (e.g., "Mother", "Son", "Friend")
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Health specific data
  healthInfo: {
    height?: { value: number; unit: 'cm' | 'ft' };
    weight?: { value: number; unit: 'kg' | 'lbs' };
    allergies: string[];
    medications: string[];
    chronicConditions: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    insurance?: {
      provider: string;
      policyNumber: string;
    };
    primaryDoctor?: {
      name: string;
      phone: string;
      specialty: string;
    };
  };

  // Permissions and access
  permissions: {
    canViewReports: boolean;
    canUploadReports: boolean;
    canShareReports: boolean;
    canModifyProfile: boolean;
    canViewTrends: boolean;
  };

  // Age-specific settings for children
  childSettings?: {
    parentalControls: boolean;
    restrictedSharing: boolean;
    educationalMode: boolean;
    ageVerificationRequired: boolean;
  };
}

export interface ProfileSwitchData {
  profiles: FamilyProfile[];
  activeProfileId: string;
  lastSwitched: Date;
}

export interface FamilyProfileCreate {
  name: string;
  relationshipLabel?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  bloodType?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type RelationshipType = FamilyProfile['relationship'];

// Helper function to get display label for a profile
export const getRelationshipDisplay = (profile: FamilyProfile): string => {
  if (profile.relationship === 'self') {
    return 'You';
  }
  return profile.relationshipLabel || 'Family Member';
};

// Helper function to get appropriate icon based on relationship label
export const getRelationshipIcon = (profile: FamilyProfile): string => {
  if (profile.relationship === 'self') {
    return '👤';
  }
  
  if (!profile.relationshipLabel) return '👥';
  
  const label = profile.relationshipLabel.toLowerCase();
  
  // Common relationship icons
  const iconMap: Record<string, string> = {
    'mother': '👩',
    'mom': '👩',
    'mama': '👩',
    'father': '👨',
    'dad': '👨',
    'papa': '👨',
    'son': '👦',
    'daughter': '👧',
    'child': '👶',
    'baby': '👶',
    'spouse': '💑',
    'husband': '👨',
    'wife': '👩',
    'partner': '💑',
    'brother': '👦',
    'sister': '👧',
    'sibling': '👫',
    'grandmother': '👵',
    'grandma': '👵',
    'nana': '👵',
    'grandfather': '👴',
    'grandpa': '👴',
    'friend': '👥',
    'cousin': '👥',
    'aunt': '👩',
    'uncle': '👨',
    'nephew': '👦',
    'niece': '👧'
  };
  
  for (const [key, icon] of Object.entries(iconMap)) {
    if (label.includes(key)) {
      return icon;
    }
  }
  
  return '👥'; // Default family icon
};

export const DEFAULT_PERMISSIONS = {
  self: {
    canViewReports: true,
    canUploadReports: true,
    canShareReports: true,
    canModifyProfile: true,
    canViewTrends: true,
  },
  family: {
    canViewReports: true,
    canUploadReports: true,
    canShareReports: false,
    canModifyProfile: false,
    canViewTrends: true,
  }
};