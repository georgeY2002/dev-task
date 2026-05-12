export type Provider = {
  providerId: string;
  name: string;
  specialty: string;
  location: string;
};

const PROVIDERS: readonly Provider[] = [
  {
    providerId: "demo-001",
    name: "Dr. Maya Thompson",
    specialty: "Family Medicine",
    location: "Austin, TX"
  },
  {
    providerId: "demo-002",
    name: "Dr. Daniel Kim",
    specialty: "Cardiology",
    location: "Seattle, WA"
  },
  {
    providerId: "demo-003",
    name: "Dr. Aisha Patel",
    specialty: "Dermatology",
    location: "Chicago, IL"
  }
] as const;

export function getAllProviders(): Provider[] {
  return [...PROVIDERS];
}

export function getProviderByProviderId(providerId: string): Provider | undefined {
  return PROVIDERS.find((provider) => provider.providerId === providerId);
}
