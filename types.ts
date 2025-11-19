
export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  DOCTOR = 'DOCTOR',
  MARKET = 'MARKET'
}

export type Language = 'en' | 'tw' | 'ee' | 'ga';

export const SUPPORTED_LANGUAGES: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'tw', label: 'Twi' },
  { id: 'ee', label: 'Ewe' },
  { id: 'ga', label: 'Ga' },
];

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  imageUrl?: string; // Added for generative images
  timestamp: Date;
  isError?: boolean;
}

export interface MarketItem {
  name: string;
  price: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface MarketplaceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  sellerName: string;
  rating: number;
  reviews: number;
  location: string;
  category: string;
  image?: string;
  isVerified?: boolean;
}

export interface WeatherData {
  temp: string;
  precipitation: string;
  wind: string;
  condition: string;
  locationName: string;
  fromCache?: boolean;
}

export interface NewsResponse {
  text: string;
  links: { title: string; url: string }[];
  fromCache?: boolean;
}

export interface PlantingResponse {
  text: string;
  fromCache?: boolean;
}

export interface PestForecast {
  riskLevel: 'Low' | 'Medium' | 'High';
  alert: string;
  preventiveAction: string;
  fromCache?: boolean;
}

export interface CropInfo {
  name: string;
  plantingSeason: string;
  careTips: string;
  commonPests: string[];
  commonDiseases: string[];
  soilRequirements: string;
  companionPlants: string[];
  harvesting: string;
  fromCache?: boolean;
}

export interface AnalysisResult {
  cropName: string;
  diagnosis: string;
  issues: Array<{
    label: string;
    box_2d?: number[]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  }>;
  treatment: string[];
}

export interface RotationAdvice {
  recommendedCrops: string[];
  reasoning: string;
  soilBenefits: string;
}