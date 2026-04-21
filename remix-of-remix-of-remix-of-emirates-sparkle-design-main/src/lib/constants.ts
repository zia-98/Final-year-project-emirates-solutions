// Company Information - India Localization
export const COMPANY = {
  name: "Emirates Solutions",
  tagline: "Technology Partner",
  owner: "Talha Gadbade",
  
  // Contact Details - ONLY ONE NUMBER
  phone: "+91 79722 81583",
  email: "info@esrtn.in",
  emailSupport: "support@esrtn.in",
  
  // Address
  address: {
    line1: "Udyam Nagar Rd, Patwardhan Wadi",
    city: "Ratnagiri",
    state: "Maharashtra",
    pincode: "415639",
    country: "India",
    full: "Udyam Nagar Rd, Patwardhan Wadi, Ratnagiri, Maharashtra 415639, India",
  },
  
  // Map Coordinates (Ratnagiri)
  coordinates: {
    lat: 16.9944,
    lng: 73.3002,
  },
  
  // Social Links
  social: {
    facebook: "https://facebook.com/emiratessolutions",
    twitter: "https://x.com/emiratessolutions",
    instagram: "https://instagram.com/emiratessolutions",
    linkedin: "https://linkedin.com/company/emiratessolutions",
    youtube: "https://youtube.com/@emiratessolutions",
  },
  
  // Office Hours
  hours: {
    weekdays: "Monday - Friday: 9:00 AM - 6:00 PM",
    saturday: "Saturday: 10:00 AM - 4:00 PM",
    sunday: "Sunday: Closed",
  },
  
  // Founded Year
  founded: 2015,
};

// Currency Configuration
export const CURRENCY = {
  code: "INR",
  symbol: "₹",
  locale: "en-IN",
};

// Format price in INR
export const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: "currency",
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format number in Indian format (lakhs, crores)
export const formatIndianNumber = (num: number): string => {
  return new Intl.NumberFormat(CURRENCY.locale).format(num);
};
