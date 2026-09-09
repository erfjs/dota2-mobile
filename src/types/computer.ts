export interface Computer {
  id: string;
  name: string;
  host: string;
  /** Short label shown under the name, e.g. room / OS */
  subtitle: string;
  /** Whether the relay responded to a live probe */
  online: boolean;
  lastSeenLabel: string;
}
